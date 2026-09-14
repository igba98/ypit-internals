'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Search, Trash2, FileText, ArrowUpRight } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Partner, PartnerKind, PartnerStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { deletePartner } from '@/lib/actions/partnerActions';
import { PartnerForm } from './PartnerForm';
import { PARTNER_KIND, PARTNER_STATUS, statusBadge } from './partner-config';

/** Module-level so render stays pure (react-hooks/purity). */
function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function PartnersTable({
  kind,
  partners,
  canEdit,
}: {
  kind: PartnerKind;
  partners: Partner[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const cfg = PARTNER_KIND[kind];
  const [, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | PartnerStatus>('');
  const [editing, setEditing] = useState<Partner | null>(null);

  const term = q.trim().toLowerCase();
  const rows = partners.filter(
    (p) =>
      (!status || p.status === status) &&
      (!term ||
        [p.name, p.contactName, p.country, p.city, p.category]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))),
  );

  const onDelete = (p: Partner) => {
    if (!confirm(`Remove ${p.name}? Its contracts and files are removed too.`)) return;
    startTransition(async () => {
      const res = await deletePartner(kind, p.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${cfg.plural.toLowerCase()}, contacts, locations…`}
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as '' | PartnerStatus)} className="w-44">
          <option value="">All statuses</option>
          {PARTNER_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <span className="text-xs text-gray-500">{rows.length} of {partners.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">{cfg.singular}</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Contracts</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Last contact</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((p) => {
              const contracts = p.contracts ?? [];
              const active = contracts.filter((c) => c.status === 'ACTIVE').length;
              return (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`${cfg.base}/${p.id}`} className="font-semibold text-gray-900 hover:text-primary inline-flex items-center gap-1">
                      {p.name} <ArrowUpRight className="w-3 h-3 text-gray-400" />
                    </Link>
                    {p.category && <p className="text-[11px] text-gray-500">{p.category}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-700">
                    {p.contactName ?? '-'}
                    {p.contactPhone && <p className="text-[11px] text-gray-400">{p.contactPhone}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {[p.city, p.country].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      {contracts.length}
                      {active > 0 && <span className="text-green-700">({active} active)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                    {p.expiryDate ? (
                      <span className={isPast(p.expiryDate) ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {formatDate(p.expiryDate)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {p.lastContactAt ? formatDate(p.lastContactAt) : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setEditing(p)} className="text-gray-400 hover:text-primary p-1.5 rounded-md hover:bg-gray-100" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(p)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">
                  {partners.length === 0
                    ? `No ${cfg.plural.toLowerCase()} yet. Use “Add ${cfg.singular}” to register the first one.`
                    : 'Nothing matches that search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit · ${editing.name}` : 'Edit'}
        description="Update the profile, contact person, or partnership status."
      >
        {editing && <PartnerForm kind={kind} existing={editing} onDone={() => setEditing(null)} />}
      </SlideInPanel>
    </div>
  );
}
