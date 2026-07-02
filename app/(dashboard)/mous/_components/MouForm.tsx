'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, ScrollText, Upload } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mou, MouStatus, University } from '@/types';
import {
  createMou,
  updateMou,
  requestMouUploadUrl,
  finalizeMouUpload,
} from '@/lib/actions/mouActions';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

const STATUSES: { value: MouStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'TERMINATED', label: 'Terminated' },
];

/** Browser → R2 direct PUT via the presigned URL. */
function putToR2(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ ok: boolean; status: number }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream',
    );
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    });
    xhr.onload = () =>
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status });
    xhr.onerror = () => resolve({ ok: false, status: xhr.status || 0 });
    xhr.send(file);
  });
}

export function AddMouButton({ universities }: { universities: University[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> Add MOU
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add MOU"
        description="Register a Memorandum of Understanding and attach the signed document."
      >
        <MouForm universities={universities} onDone={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

export function MouForm({
  existing,
  universities,
  onDone,
}: {
  existing?: Mou;
  universities: University[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [universityId, setUniversityId] = useState(existing?.universityId ?? '');
  const [partnerName, setPartnerName] = useState(
    existing && !existing.universityId ? existing.partnerName : '',
  );
  const [description, setDescription] = useState(existing?.description ?? '');
  const [status, setStatus] = useState<MouStatus>(existing?.status ?? 'DRAFT');
  const [signedDate, setSignedDate] = useState(
    existing?.signedDate?.slice(0, 10) ?? '',
  );
  const [effectiveDate, setEffectiveDate] = useState(
    existing?.effectiveDate?.slice(0, 10) ?? '',
  );
  const [expiryDate, setExpiryDate] = useState(
    existing?.expiryDate?.slice(0, 10) ?? '',
  );
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const uploadTo = async (mouId: string): Promise<boolean> => {
    if (!file) return true;
    const ticketRes = await requestMouUploadUrl(mouId, {
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    });
    if (!ticketRes.success || !ticketRes.ticket) {
      toast.error(ticketRes.message);
      return false;
    }
    setProgress(0);
    const put = await putToR2(ticketRes.ticket.uploadUrl, file, setProgress);
    if (!put.ok) {
      toast.error(`Upload failed (HTTP ${put.status}).`);
      setProgress(null);
      return false;
    }
    const fin = await finalizeMouUpload(mouId, ticketRes.ticket.storageKey);
    setProgress(null);
    if (!fin.success) {
      toast.error(fin.message);
      return false;
    }
    return true;
  };

  const submit = () => {
    if (title.trim().length < 2) return toast.error('Give the MOU a title.');
    if (!universityId && partnerName.trim().length < 2) {
      return toast.error('Pick a university or type the partner name.');
    }
    if (file && file.size > MAX_FILE_BYTES) {
      return toast.error('File is over the 25 MB limit.');
    }

    startTransition(async () => {
      const payload = {
        title: title.trim(),
        universityId: universityId || undefined,
        partnerName: universityId ? undefined : partnerName.trim(),
        description: description.trim() || undefined,
        signedDate: signedDate || undefined,
        effectiveDate: effectiveDate || undefined,
        expiryDate: expiryDate || undefined,
        status,
      };

      if (existing) {
        const res = await updateMou(existing.id, payload);
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        const uploaded = await uploadTo(existing.id);
        if (uploaded) {
          toast.success('MOU updated.');
          onDone();
          router.refresh();
        }
      } else {
        const res = await createMou(payload);
        if (!res.success || !res.mouId) {
          toast.error(res.message);
          return;
        }
        const uploaded = await uploadTo(res.mouId);
        toast.success(
          uploaded ? res.message : `${res.message} (document not attached)`,
        );
        onDone();
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Student Recruitment MOU 2026–2028"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="universityId">University</Label>
          <Select
            id="universityId"
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
          >
            <option value="">— Not in catalog —</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.country})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partnerName">Partner name (if not listed)</Label>
          <Input
            id="partnerName"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="e.g. XYZ College"
            disabled={Boolean(universityId)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="signedDate">Signed</Label>
          <Input
            id="signedDate"
            type="date"
            value={signedDate}
            onChange={(e) => setSignedDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="effectiveDate">Effective</Label>
          <Input
            id="effectiveDate"
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expires</Label>
          <Input
            id="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as MouStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Key terms, renewal conditions, commission notes…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">
          {existing?.storageKey ? 'Replace document' : 'Signed document'} (PDF /
          Word, max 25 MB)
        </Label>
        <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
          <Upload className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600 truncate">
            {file?.name ??
              (existing?.originalName
                ? `Current: ${existing.originalName}`
                : 'Choose file…')}
          </span>
          <input
            id="file"
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {progress !== null && (
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
        )}
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ScrollText className="w-4 h-4" />
          )}
          {existing ? 'Save changes' : 'Create MOU'}
        </Button>
      </div>
    </div>
  );
}
