'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Download,
  FileText,
  FileX2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PartnerContract, PartnerContractStatus, PartnerKind } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  addContract,
  updateContract,
  deleteContract,
  requestContractUploadUrl,
  finalizeContractUpload,
  getContractDownloadUrl,
} from '@/lib/actions/partnerActions';
import { CONTRACT_STATUS, contractBadge } from './partner-config';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/** Browser → R2 direct PUT via the presigned URL. */
function putToR2(uploadUrl: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<{ ok: boolean; status: number }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    });
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status });
    xhr.onerror = () => resolve({ ok: false, status: xhr.status || 0 });
    xhr.send(file);
  });
}

export function ContractsCard({
  kind,
  partnerId,
  contracts,
  canEdit,
}: {
  kind: PartnerKind;
  partnerId: string;
  contracts: PartnerContract[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PartnerContract | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const onDownload = (c: PartnerContract) => {
    setDownloadingId(c.id);
    startTransition(async () => {
      const res = await getContractDownloadUrl(partnerId, c.id);
      if (res.success && res.url) window.open(res.url, '_blank', 'noopener');
      else toast.error(res.message);
      setDownloadingId(null);
    });
  };
  const onDelete = (c: PartnerContract) => {
    if (!confirm(`Delete contract "${c.title}"? The attached file is removed too.`)) return;
    startTransition(async () => {
      const res = await deleteContract(kind, partnerId, c.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Contracts & agreements
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Every signed agreement with this partner, with start and expiry dates.
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add contract
          </Button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {contracts.map((c) => (
          <div key={c.id} className="px-5 py-4 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{c.title}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${contractBadge(c.status)}`}>
                  {c.status}
                </span>
              </div>
              {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
              <p className="text-[11px] text-gray-500 mt-1">
                {c.signedDate && <>Signed {formatDate(c.signedDate)} · </>}
                {c.startDate && <>Starts {formatDate(c.startDate)} · </>}
                {c.expiryDate ? (
                  <span className={isPast(c.expiryDate) ? 'text-red-600 font-medium' : ''}>
                    Expires {formatDate(c.expiryDate)}
                  </span>
                ) : (
                  'No expiry set'
                )}
              </p>
              <div className="mt-1.5">
                {c.storageKey ? (
                  <button
                    onClick={() => onDownload(c)}
                    disabled={busy && downloadingId === c.id}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    {busy && downloadingId === c.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span className="max-w-[240px] truncate">{c.originalName ?? 'Download'}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <FileX2 className="w-3.5 h-3.5" /> no document attached
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditing(c)} className="text-gray-400 hover:text-primary p-1.5 rounded-md hover:bg-gray-100" title="Edit / attach file">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(c)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {contracts.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No contracts yet. {canEdit && 'Add the first agreement and attach the signed copy.'}
          </p>
        )}
      </div>

      <SlideInPanel isOpen={adding} onClose={() => setAdding(false)} title="Add contract" description="Record the agreement and attach the signed document.">
        <ContractForm kind={kind} partnerId={partnerId} onDone={() => setAdding(false)} />
      </SlideInPanel>
      <SlideInPanel isOpen={editing !== null} onClose={() => setEditing(null)} title={editing ? `Edit · ${editing.title}` : 'Edit'} description="Update dates, status, or replace the document.">
        {editing && <ContractForm kind={kind} partnerId={partnerId} existing={editing} onDone={() => setEditing(null)} />}
      </SlideInPanel>
    </div>
  );
}

function ContractForm({
  kind,
  partnerId,
  existing,
  onDone,
}: {
  kind: PartnerKind;
  partnerId: string;
  existing?: PartnerContract;
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [status, setStatus] = useState<PartnerContractStatus>(existing?.status ?? 'DRAFT');
  const [signedDate, setSignedDate] = useState(existing?.signedDate?.slice(0, 10) ?? '');
  const [startDate, setStartDate] = useState(existing?.startDate?.slice(0, 10) ?? '');
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate?.slice(0, 10) ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const uploadTo = async (contractId: string): Promise<boolean> => {
    if (!file) return true;
    const t = await requestContractUploadUrl(partnerId, contractId, {
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    });
    if (!t.success || !t.ticket) {
      toast.error(t.message);
      return false;
    }
    setProgress(0);
    const put = await putToR2(t.ticket.uploadUrl, file, setProgress);
    if (!put.ok) {
      setProgress(null);
      toast.error(`Upload failed (HTTP ${put.status}).`);
      return false;
    }
    const fin = await finalizeContractUpload(kind, partnerId, contractId, t.ticket.storageKey);
    setProgress(null);
    if (!fin.success) {
      toast.error(fin.message);
      return false;
    }
    return true;
  };

  const submit = () => {
    if (title.trim().length < 2) {
      toast.error('Give the contract a title.');
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error('File is over the 25 MB limit.');
      return;
    }
    startTransition(async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        signedDate: signedDate || undefined,
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
      };
      let id = existing?.id;
      if (existing) {
        const res = await updateContract(kind, partnerId, existing.id, payload);
        if (!res.success) {
          toast.error(res.message);
          return;
        }
      } else {
        const res = await addContract(kind, partnerId, payload);
        if (!res.success || !res.contractId) {
          toast.error(res.message);
          return;
        }
        id = res.contractId;
      }
      const uploaded = await uploadTo(id!);
      toast.success(uploaded ? (existing ? 'Contract updated.' : 'Contract added.') : 'Saved, but the document was not attached.');
      onDone();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ctitle">Title *</Label>
        <Input id="ctitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Student referral agreement 2026–2028" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="csigned">Signed</Label>
          <Input id="csigned" type="date" value={signedDate} onChange={(e) => setSignedDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cstart">Start</Label>
          <Input id="cstart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cexpiry">Expires</Label>
          <Input id="cexpiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cstatus">Status</Label>
        <Select id="cstatus" value={status} onChange={(e) => setStatus(e.target.value as PartnerContractStatus)}>
          {CONTRACT_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cdesc">Key terms / notes</Label>
        <Textarea id="cdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{existing?.storageKey ? 'Replace document' : 'Signed document'} (PDF / Word / image, max 25 MB)</Label>
        <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
          <Upload className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600 truncate">
            {file?.name ?? (existing?.originalName ? `Current: ${existing.originalName}` : 'Choose file…')}
          </span>
          <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {progress !== null && (
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.round(progress)}%` }} />
          </div>
        )}
      </div>
      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {existing ? 'Save changes' : 'Add contract'}
        </Button>
      </div>
    </div>
  );
}
