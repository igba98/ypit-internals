'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users,
  Trash2,
  Loader2,
  Search,
  Mail,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { ContactGroup, ContactGroupDetail } from '@/types';
import {
  deleteContactGroup,
  getContactGroup,
} from '@/lib/actions/campaignActions';

export function GroupsList({ groups }: { groups: ContactGroup[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactGroupDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const openDetail = (g: ContactGroup) => {
    setLoadingId(g.id);
    startTransition(async () => {
      const res = await getContactGroup(g.id);
      if (res.success && res.group) {
        setQuery('');
        setDetail(res.group);
      } else {
        toast.error(res.message);
      }
      setLoadingId(null);
    });
  };

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

  const q = query.trim().toLowerCase();
  const members = (detail?.contacts ?? []).filter(
    (c) =>
      !q ||
      c.fullName.toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.studentName ?? '').toLowerCase().includes(q),
  );

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
              className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors cursor-pointer"
              onClick={() => openDetail(g)}
              title="View members"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{g.name}</p>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
                    {g.contactCount}
                  </span>
                  {loadingId === g.id && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  )}
                </div>
                {g.description && (
                  <p className="text-xs text-gray-500 truncate">{g.description}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {g.createdByName} · {formatDate(g.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(g);
                }}
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
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </li>
          ))}
        </ul>
      )}

      {/* ── Members panel with search ── */}
      <SlideInPanel
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.name} · ${detail.contacts.length} contacts` : 'Group'}
        description={detail?.description ?? 'Everyone in this group.'}
      >
        {detail && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone, email, student…"
                className="pl-9"
              />
            </div>

            <p className="text-[11px] text-gray-400">
              Showing {members.length} of {detail.contacts.length}
            </p>

            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {members.map((c) => (
                <li key={c.id} className="px-3 py-2.5 bg-white">
                  <p className="text-sm font-medium text-gray-900">{c.fullName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-gray-500">
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </span>
                    )}
                    {c.relation && <span>{c.relation}</span>}
                    {c.studentName && (
                      <span className="text-gray-400">→ {c.studentName}</span>
                    )}
                  </div>
                </li>
              ))}
              {members.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-gray-500 bg-white">
                  No contacts match “{query}”.
                </li>
              )}
            </ul>
          </div>
        )}
      </SlideInPanel>
    </div>
  );
}
