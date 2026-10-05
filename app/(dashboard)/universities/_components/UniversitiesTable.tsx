'use client';

import { Fragment, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowUpRight, Globe, Landmark, Pencil, Plus, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PartnershipStatus, University } from '@/types';
import { setUniversityPriority } from '@/lib/actions/catalogActions';
import { UniversityForm } from '../../finance/catalog/_components/UniversityForm';

const PARTNERSHIP_BADGE: Record<PartnershipStatus, string> = {
  PROSPECT: 'bg-gray-100 text-gray-600',
  IN_DISCUSSION: 'bg-blue-50 text-blue-700',
  MOU_SIGNED: 'bg-indigo-50 text-indigo-700',
  ACTIVE: 'bg-green-100 text-green-800',
  DORMANT: 'bg-amber-100 text-amber-800',
  ENDED: 'bg-red-100 text-red-700',
};

/**
 * Country-based structure (system update Oct 2026): universities are grouped
 * by country and, within a country, priority ones come first. The backend
 * already returns them in that order; grouping here keeps it visible.
 */
function groupByCountry(rows: University[]): [string, University[]][] {
  const map = new Map<string, University[]>();
  for (const u of rows) {
    map.set(u.country, [...(map.get(u.country) ?? []), u]);
  }
  return [...map.entries()].map(([country, list]) => [
    country,
    [...list].sort(
      (a, b) =>
        Number((b.priority ?? 'STANDARD') === 'PRIORITY') -
          Number((a.priority ?? 'STANDARD') === 'PRIORITY') ||
        a.name.localeCompare(b.name),
    ),
  ]);
}

export function UniversitiesTable({
  universities,
  canEdit,
}: {
  universities: University[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [scope, setScope] = useState<'ALL' | 'LOCAL' | 'INTERNATIONAL'>('ALL');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);

  const term = q.trim().toLowerCase();
  const rows = universities.filter(
    (u) =>
      (scope === 'ALL' || (u.scope ?? 'INTERNATIONAL') === scope) &&
      (!priorityOnly || (u.priority ?? 'STANDARD') === 'PRIORITY') &&
      (!term || [u.name, u.country, u.city].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))),
  );
  const local = universities.filter((u) => u.scope === 'LOCAL').length;
  const priorityCount = universities.filter((u) => (u.priority ?? 'STANDARD') === 'PRIORITY').length;
  const countries = groupByCountry(rows);

  const togglePriority = (u: University) => {
    const next = (u.priority ?? 'STANDARD') === 'PRIORITY' ? 'STANDARD' : 'PRIORITY';
    startTransition(async () => {
      const res = await setUniversityPriority(u.id, next);
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
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {([['ALL', `All · ${universities.length}`], ['LOCAL', `Local · ${local}`], ['INTERNATIONAL', `International · ${universities.length - local}`]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setScope(v)}
              className={`px-3 py-1.5 text-xs font-medium ${scope === v ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setPriorityOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium border inline-flex items-center gap-1.5 ${
            priorityOnly
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
          title="Show only priority universities"
        >
          <Star className={`w-3.5 h-3.5 ${priorityOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
          Priority · {priorityCount}
        </button>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search universities, countries…" className="pl-9" />
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add University
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">University</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Partnership</th>
              <th className="px-4 py-3 font-medium">Programmes</th>
              <th className="px-4 py-3 font-medium">Agreements</th>
              <th className="px-4 py-3 font-medium">Scholarships</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {countries.map(([country, list]) => (
              <Fragment key={country}>
                <tr className="bg-gray-100/80 border-y border-gray-200">
                  <td colSpan={9} className="px-4 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-700">{country}</span>
                    <span className="text-[11px] text-gray-500 ml-2">
                      {`${list.length} ${list.length === 1 ? 'university' : 'universities'}`}
                      {list.some((x) => (x.priority ?? 'STANDARD') === 'PRIORITY') &&
                        ` · ${list.filter((x) => (x.priority ?? 'STANDARD') === 'PRIORITY').length} priority`}
                    </span>
                  </td>
                </tr>
                {list.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <Link href={`/universities/${u.id}`} className="font-semibold text-gray-900 hover:text-primary inline-flex items-center gap-1">
                    {u.name} <ArrowUpRight className="w-3 h-3 text-gray-400" />
                  </Link>
                  {u.city && <p className="text-[11px] text-gray-400">{u.city}</p>}
                  {u.website && (
                    <p className="text-[11px] text-gray-400 inline-flex items-center gap-1"><Globe className="w-3 h-3" /> {u.website.replace(/^https?:\/\//, '')}</p>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {canEdit ? (
                    <button
                      onClick={() => togglePriority(u)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                      title={(u.priority ?? 'STANDARD') === 'PRIORITY' ? 'Move to other universities' : 'Mark as priority'}
                    >
                      <Star
                        className={`w-4 h-4 ${(u.priority ?? 'STANDARD') === 'PRIORITY' ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`}
                      />
                      <span className={(u.priority ?? 'STANDARD') === 'PRIORITY' ? 'text-amber-800' : 'text-gray-400'}>
                        {(u.priority ?? 'STANDARD') === 'PRIORITY' ? 'Priority' : 'Other'}
                      </span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <Star className={`w-4 h-4 ${(u.priority ?? 'STANDARD') === 'PRIORITY' ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                      {(u.priority ?? 'STANDARD') === 'PRIORITY' ? 'Priority' : 'Other'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.scope === 'LOCAL' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                    {u.scope === 'LOCAL' ? 'Local' : 'International'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {u.partnership ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${PARTNERSHIP_BADGE[u.partnership.status]}`}>
                      {u.partnership.status.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">not tracked</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-700">
                  {u._count?.packages ?? 0} priced
                  {u.programsSummary && <p className="text-[11px] text-gray-400 max-w-[200px] truncate" title={u.programsSummary}>{u.programsSummary}</p>}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-700">{`${u._count?.mous ?? 0} ${(u._count?.mous ?? 0) === 1 ? 'MOU' : 'MOUs'}`}</td>
                <td className="px-4 py-3.5 text-xs">
                  {u.scholarshipNotes ? <span className="text-green-700 font-medium">Yes</span> : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-600">{u.contactName ?? '-'}{u.contactEmail && <p className="text-[11px] text-gray-400">{u.contactEmail}</p>}</td>
                <td className="px-4 py-3.5 text-right">
                  {canEdit && (
                    <button onClick={() => setEditing(u)} className="text-gray-400 hover:text-primary p-1.5 rounded-md hover:bg-gray-100" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
                ))}
              </Fragment>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-500">
                  <Landmark className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  {universities.length === 0 ? 'No universities in the catalog yet.' : 'Nothing matches that filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && <UniversityForm mode="create" onClose={() => setCreating(false)} />}
      {editing && <UniversityForm mode="edit" university={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
