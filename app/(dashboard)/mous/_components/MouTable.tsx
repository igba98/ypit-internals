'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Download,
  FileX2,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Mou, MouStatus, University } from '@/types';
import { formatDate } from '@/lib/utils';
import { deleteMou, getMouDownloadUrl } from '@/lib/actions/mouActions';
import { MouForm } from './MouForm';

const STATUS_BADGE: Record<MouStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-amber-100 text-amber-800',
  TERMINATED: 'bg-red-100 text-red-700',
};

/** Module-level so component render stays pure (react-hooks/purity). */
function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function MouTable({
  mous,
  universities,
}: {
  mous: Mou[];
  universities: University[];
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [editing, setEditing] = useState<Mou | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const onDownload = (m: Mou) => {
    setDownloadingId(m.id);
    startTransition(async () => {
      const res = await getMouDownloadUrl(m.id);
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener');
      } else {
        toast.error(res.message);
      }
      setDownloadingId(null);
    });
  };

  const onDelete = (m: Mou) => {
    if (!confirm(`Delete MOU "${m.title}"? The attached file is removed too.`))
      return;
    startTransition(async () => {
      const res = await deleteMou(m.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">MOU</th>
              <th className="px-4 py-3 font-medium">Partner</th>
              <th className="px-4 py-3 font-medium">Signed</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mous.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-gray-900">{m.title}</p>
                  {m.description && (
                    <p
                      className="text-[11px] text-gray-500 max-w-[260px] truncate"
                      title={m.description}
                    >
                      {m.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-700">
                  {m.university?.name ?? m.partnerName}
                  {m.university?.country && (
                    <p className="text-[11px] text-gray-400">
                      {m.university.country}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                  {m.signedDate ? formatDate(m.signedDate) : '-'}
                </td>
                <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                  {m.expiryDate ? (
                    <span
                      className={
                        isPast(m.expiryDate)
                          ? 'text-red-600 font-medium'
                          : 'text-gray-500'
                      }
                    >
                      {formatDate(m.expiryDate)}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[m.status]}`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {m.storageKey ? (
                    <button
                      onClick={() => onDownload(m)}
                      disabled={busy && downloadingId === m.id}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      title={m.originalName ?? 'Download'}
                    >
                      {busy && downloadingId === m.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span className="max-w-[140px] truncate">
                        {m.originalName ?? 'Download'}
                      </span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <FileX2 className="w-3.5 h-3.5" /> none
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setEditing(m)}
                      className="text-gray-400 hover:text-primary p-1.5 rounded-md hover:bg-gray-100"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(m)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {mous.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No MOUs registered yet. Use “Add MOU” to file the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit · ${editing.title}` : 'Edit'}
        description="Update terms, dates, status, or replace the document."
      >
        {editing && (
          <MouForm
            existing={editing}
            universities={universities}
            onDone={() => setEditing(null)}
          />
        )}
      </SlideInPanel>
    </div>
  );
}
