'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Download, Loader2, Search, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocumentStatus, DocumentType, PipelineStage } from '@/types';
import { formatDate } from '@/lib/utils';
import { getDocumentDownloadUrl, rejectDocument, verifyDocument } from '@/lib/actions/documentActions';

export interface QueueDoc {
  id: string;
  studentId: string;
  type: DocumentType;
  originalName: string;
  sizeBytes: number;
  status: DocumentStatus;
  notes?: string | null;
  rejectionReason?: string | null;
  expiresAt?: string | null;
  uploadedByName: string;
  createdAt: string;
  student: { id: string; fullName: string; registrationNumber: string; pipelineStage: PipelineStage };
}

const TABS = [
  { key: 'PENDING_REVIEW', label: 'Awaiting review' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All' },
];
const STATUS_CLS: Record<DocumentStatus, string> = {
  UPLOADING: 'bg-gray-100 text-gray-500',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
};

export function DocumentsQueue({ items, status, canVerify }: { items: QueueDoc[]; status: string; canVerify: boolean }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [q, setQ] = useState('');

  const term = q.trim().toLowerCase();
  const rows = items.filter((d) => !term || [d.student?.fullName, d.student?.registrationNumber, d.originalName, d.type].some((v) => String(v ?? '').toLowerCase().includes(term)));

  const act = (d: QueueDoc, fn: () => Promise<{ success: boolean; message?: string; url?: string }>, open = false) => {
    setBusyId(d.id);
    startTransition(async () => {
      const r = await fn();
      setBusyId(null);
      if (!r.success) {
        toast.error(r.message ?? 'Failed.');
        return;
      }
      if (open && r.url) window.open(r.url, '_blank', 'noopener');
      else {
        toast.success(r.message ?? 'Done.');
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {TABS.map((t) => (
            <Link key={t.key} href={t.key === 'PENDING_REVIEW' ? '/documents' : `/documents?status=${t.key}`} className={`px-3 py-1.5 text-xs font-medium ${status === t.key ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{t.label}</Link>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student, file, type…" className="pl-9" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <Link href={`/students/${d.studentId}`} className="font-medium text-gray-900 hover:text-primary">{d.student?.fullName ?? 'Student'}</Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-500">{d.student?.registrationNumber}</span>
                    {d.student && <StatusBadge status={d.student.pipelineStage} variant="pipeline" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-900">{d.type.replace(/_/g, ' ').toLowerCase()}</p>
                  <p className="text-[11px] text-gray-500 max-w-[220px] truncate" title={d.originalName}>{d.originalName}</p>
                  {d.rejectionReason && <p className="text-[11px] text-red-600">Rejected: {d.rejectionReason}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(d.createdAt)}<p className="text-[11px]">{d.uploadedByName}</p></td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{d.expiresAt ? formatDate(d.expiresAt) : '-'}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLS[d.status]}`}>{d.status.replace('_', ' ').toLowerCase()}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {busyId === d.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                    <button onClick={() => act(d, () => getDocumentDownloadUrl(d.id), true)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Download className="w-3.5 h-3.5" /> Open</button>
                    {canVerify && d.status !== 'VERIFIED' && (
                      <button onClick={() => act(d, () => verifyDocument(d.id, d.studentId))} className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline"><CheckCircle2 className="w-3.5 h-3.5" /> Verify</button>
                    )}
                    {canVerify && d.status !== 'REJECTED' && (
                      <button
                        onClick={() => {
                          const reason = prompt(`Why is "${d.originalName}" rejected? (shown to the officer)`);
                          if (reason && reason.trim().length >= 3) act(d, () => rejectDocument(d.id, d.studentId, reason.trim()));
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">{status === 'PENDING_REVIEW' ? 'Nothing waiting for review.' : 'No documents here.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
