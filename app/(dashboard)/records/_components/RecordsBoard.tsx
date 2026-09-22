'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Building, Download, FileX2, FolderLock, HardHat, Loader2, Pencil, Plus, Search, Trash2, Upload, UserRound, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AdminDocCategory, AdminDocument, User } from '@/types';
import { formatDate } from '@/lib/utils';
import { deleteRecord, finalizeRecordUpload, recordDownloadUrl, requestRecordUpload, saveRecord } from '@/lib/actions/adminRecordActions';

const TABS: { key: AdminDocCategory; label: string; icon: typeof Building; hint: string; types: string[] }[] = [
  { key: 'COMPANY', label: 'Company documents', icon: Building, hint: 'Licences, certificates, leases, tax & registration papers', types: ['Business licence', 'Certificate of incorporation', 'TIN / VAT certificate', 'Lease agreement', 'Insurance policy', 'Accreditation'] },
  { key: 'EMPLOYEE', label: 'Employees', icon: UserRound, hint: 'Contracts, IDs, CVs and certificates for staff', types: ['Employment contract', 'National ID', 'CV', 'Academic certificate', 'NSSF registration', 'Offer letter'] },
  { key: 'INTERN', label: 'Interns', icon: GraduationCap, hint: 'Internship letters, IDs and university documents', types: ['Internship letter', 'National ID', 'University introduction letter', 'CV', 'Evaluation form'] },
  { key: 'FIELD', label: 'Field workers', icon: HardHat, hint: 'Agreements and IDs for people working in the field', types: ['Field agreement', 'National ID', 'Referee letter', 'Payment agreement'] },
];

const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Module-level: date maths out of render (react-hooks/purity). */
function expiryState(iso?: string | null): 'expired' | 'soon' | 'ok' | 'none' {
  if (!iso) return 'none';
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (t < now) return 'expired';
  if (t < now + 60 * 86_400_000) return 'soon';
  return 'ok';
}

function putToR2(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<{ ok: boolean; status: number }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.addEventListener('progress', (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100));
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status });
    xhr.onerror = () => resolve({ ok: false, status: xhr.status || 0 });
    xhr.send(file);
  });
}

type StaffOpt = Pick<User, 'id' | 'fullName' | 'role'>;

export function RecordsBoard({ records, staff, initialTab, canEdit }: { records: AdminDocument[]; staff: StaffOpt[]; initialTab: AdminDocCategory; canEdit: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [tab, setTab] = useState<AdminDocCategory>(initialTab);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<AdminDocument | 'new' | null>(null);

  const cfg = TABS.find((t) => t.key === tab)!;
  const term = q.trim().toLowerCase();
  const rows = records.filter((r) => r.category === tab && (!term || [r.title, r.docType, r.personName, r.notes].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))));
  const expiring = records.filter((r) => ['expired', 'soon'].includes(expiryState(r.expiryDate)));

  const download = (r: AdminDocument) =>
    startTransition(async () => {
      const res = await recordDownloadUrl(r.id);
      if (res.success && res.url) window.open(res.url, '_blank', 'noopener');
      else toast.error(res.message);
    });
  const remove = (r: AdminDocument) => {
    if (!confirm(`Delete "${r.title}"? The attached file is removed too.`)) return;
    startTransition(async () => {
      const res = await deleteRecord(r.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-4">
      {expiring.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {expiring.length} document{expiring.length === 1 ? ' is' : 's are'} expired or expiring within 60 days - check the red and amber dates below.
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TABS.map((t) => {
          const n = records.filter((r) => r.category === t.key).length;
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`text-left rounded-xl border p-4 transition-colors ${tab === t.key ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
              <Icon className={`w-4 h-4 ${tab === t.key ? 'text-primary' : 'text-gray-400'}`} />
              <p className="text-sm font-semibold text-gray-900 mt-2">{t.label}</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{n}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div>
            <p className="text-sm font-bold text-gray-900">{cfg.label}</p>
            <p className="text-xs text-gray-500">{cfg.hint}</p>
          </div>
          <div className="flex-1" />
          <div className="relative w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, person, type…" className="pl-9" />
          </div>
          {canEdit && <Button size="sm" onClick={() => setEditing('new')} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add document</Button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Document</th>
                {tab !== 'COMPANY' && <th className="px-4 py-3 font-medium">Person</th>}
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const ex = expiryState(r.expiryDate);
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3"><p className="font-medium text-gray-900">{r.title}</p>{r.docType && <p className="text-[11px] text-gray-500">{r.docType}</p>}</td>
                    {tab !== 'COMPANY' && <td className="px-4 py-3 text-xs text-gray-700">{r.personName ?? '-'}{r.staffId && <p className="text-[10px] text-gray-400">has system account</p>}</td>}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{r.issuedDate ? formatDate(r.issuedDate) : '-'}</td>
                    <td className={`px-4 py-3 text-xs whitespace-nowrap ${ex === 'expired' ? 'text-red-600 font-semibold' : ex === 'soon' ? 'text-amber-700 font-semibold' : 'text-gray-500'}`}>
                      {r.expiryDate ? formatDate(r.expiryDate) : '-'}{ex === 'expired' && <p className="text-[10px] uppercase">Expired</p>}
                    </td>
                    <td className="px-4 py-3">
                      {r.storageKey ? (
                        <button onClick={() => download(r)} disabled={busy} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"><Download className="w-3.5 h-3.5" /><span className="max-w-[160px] truncate">{r.originalName ?? 'Download'}</span></button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400"><FileX2 className="w-3.5 h-3.5" /> none</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditing(r)} className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-gray-100" title="Edit / replace file"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => remove(r)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500"><FolderLock className="w-6 h-6 mx-auto mb-2 text-gray-300" />No {cfg.label.toLowerCase()} filed yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlideInPanel isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? `Add - ${cfg.label}` : 'Edit document'} description="Attach the scanned file (PDF, Word or image, up to 25 MB).">
        {editing && <RecordForm category={tab} existing={editing === 'new' ? null : editing} staff={staff} suggestions={cfg.types} onDone={() => setEditing(null)} />}
      </SlideInPanel>
    </div>
  );
}

function RecordForm({ category, existing, staff, suggestions, onDone }: { category: AdminDocCategory; existing: AdminDocument | null; staff: StaffOpt[]; suggestions: string[]; onDone: () => void }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [progress, setProgress] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState({
    title: existing?.title ?? '',
    docType: existing?.docType ?? '',
    staffId: existing?.staffId ?? '',
    personName: existing?.personName ?? '',
    issuedDate: existing?.issuedDate?.slice(0, 10) ?? '',
    expiryDate: existing?.expiryDate?.slice(0, 10) ?? '',
    notes: existing?.notes ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((v) => ({ ...v, [k]: e.target.value }));
  const personal = category !== 'COMPANY';

  const submit = () => {
    if (f.title.trim().length < 2) {
      toast.error('Give the document a title.');
      return;
    }
    if (!existing && personal && !f.staffId && !f.personName.trim()) {
      toast.error('Choose the staff member or type the person’s name.');
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error('File is over the 25 MB limit.');
      return;
    }
    startTransition(async () => {
      const payload: Record<string, unknown> = existing
        ? { title: f.title.trim(), docType: f.docType.trim() || null, personName: personal ? f.personName.trim() || null : undefined, issuedDate: f.issuedDate || null, expiryDate: f.expiryDate || null, notes: f.notes.trim() || null }
        : { category, title: f.title.trim(), docType: f.docType.trim() || undefined, staffId: personal && f.staffId ? f.staffId : undefined, personName: personal && f.personName.trim() ? f.personName.trim() : undefined, issuedDate: f.issuedDate || undefined, expiryDate: f.expiryDate || undefined, notes: f.notes.trim() || undefined };
      const saved = await saveRecord(existing?.id ?? null, payload);
      if (!saved.success || !saved.recordId) {
        toast.error(saved.message);
        return;
      }
      if (file) {
        const t = await requestRecordUpload(saved.recordId, { originalName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size });
        if (!t.success || !t.ticket) {
          toast.error(t.message);
          return;
        }
        setProgress(0);
        const put = await putToR2(t.ticket.uploadUrl, file, setProgress);
        setProgress(null);
        if (!put.ok) {
          toast.error(`Upload failed (HTTP ${put.status}).`);
          return;
        }
        const fin = await finalizeRecordUpload(saved.recordId, t.ticket.storageKey);
        if (!fin.success) {
          toast.error(fin.message);
          return;
        }
      }
      toast.success(saved.message);
      onDone();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label htmlFor="rc-title">Title *</Label><Input id="rc-title" value={f.title} onChange={set('title')} placeholder={category === 'COMPANY' ? 'e.g. Business licence 2026' : 'e.g. Employment contract'} /></div>
      <div className="space-y-2">
        <Label htmlFor="rc-type">Document type</Label>
        <Input id="rc-type" list="rc-types" value={f.docType} onChange={set('docType')} />
        <datalist id="rc-types">{suggestions.map((t) => <option key={t} value={t} />)}</datalist>
      </div>
      {personal && !existing && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="rc-staff">Staff account</Label>
            <Select id="rc-staff" value={f.staffId} onChange={set('staffId')}>
              <option value="">- No account -</option>
              {staff.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="rc-person">Or person&apos;s name</Label><Input id="rc-person" value={f.personName} onChange={set('personName')} placeholder="For people without a login" /></div>
        </div>
      )}
      {personal && existing && (
        <div className="space-y-2"><Label htmlFor="rc-person2">Person</Label><Input id="rc-person2" value={f.personName} onChange={set('personName')} /></div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="rc-issued">Issued</Label><Input id="rc-issued" type="date" value={f.issuedDate} onChange={set('issuedDate')} /></div>
        <div className="space-y-2"><Label htmlFor="rc-exp">Expires</Label><Input id="rc-exp" type="date" value={f.expiryDate} onChange={set('expiryDate')} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="rc-notes">Notes</Label><Textarea id="rc-notes" rows={2} value={f.notes} onChange={set('notes')} /></div>
      <div className="space-y-2">
        <Label>{existing?.storageKey ? 'Replace file' : 'File'}</Label>
        <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
          <Upload className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600 truncate">{file?.name ?? (existing?.originalName ? `Current: ${existing.originalName}` : 'Choose file…')}</span>
          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {progress !== null && <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.round(progress)}%` }} /></div>}
      </div>
      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderLock className="w-4 h-4" />}{existing ? 'Save changes' : 'File document'}</Button>
      </div>
    </div>
  );
}
