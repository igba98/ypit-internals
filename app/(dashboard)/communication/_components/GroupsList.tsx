'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ContactGroup } from '@/types';
import { deleteContactGroup } from '@/lib/actions/campaignActions';

export function GroupsList({ groups }: { groups: ContactGroup[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onDelete = (g: ContactGroup) => {
    if (!confirm(`Delete "${g.name}" and its ${g.contactCount} contacts?`)) return;
    setDeletingId(g.id);
    startTransition(async () => {
      const res = await deleteContactGroup(g.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">Contact Groups</h2>
        <span className="ml-auto text-xs text-gray-400">{groups.length} total</span>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No groups yet. Import a file above to create your first one.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {groups.map((g) => (
            <li
              key={g.id}
              className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{g.name}</p>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
                    {g.contactCount}
                  </span>
                </div>
                {g.description && (
                  <p className="text-xs text-gray-500 truncate">{g.description}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {g.createdByName} · {formatDate(g.createdAt)}
                </p>
              </div>
              <button
                onClick={() => onDelete(g)}
                disabled={busy && deletingId === g.id}
                title="Delete group"
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors shrink-0"
              >
                {busy && deletingId === g.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
