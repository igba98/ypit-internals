'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, Phone, Shuffle, Send, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Lead, LeadSource } from '@/types';
import { formatDate } from '@/lib/utils';
import { distributeLeads, updateLead } from '@/lib/actions/leadActions';
import { ConvertLeadForm } from './ConvertLeadForm';

const SOURCE_LABEL: Record<LeadSource, string> = {
  SOCIAL_MEDIA: 'Social Media',
  SCHOOL_VISIT: 'School Visit',
  SUB_AGENT: 'Sub Agent',
  REFERRAL: 'Referral',
  WALK_IN: 'Walk In',
  WEBSITE: 'Website',
};

const STATUS_BADGE: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  COUNSELED: 'bg-indigo-100 text-indigo-800',
  CONVERTED: 'bg-green-100 text-green-800',
  LOST: 'bg-gray-100 text-gray-600',
};

/** Statuses an officer can move a lead through by hand (CONVERTED goes via convert). */
const WORKABLE = ['NEW', 'CONTACTED', 'COUNSELED', 'LOST'] as const;

export interface Officer {
  id: string;
  fullName: string;
  role: string;
}

export function LeadsTable({
  leads,
  officers,
  canDistribute,
  canWork,
}: {
  leads: Lead[];
  officers: Officer[];
  /** IT / Marketing Manager / MD: select + assign + reassign. */
  canDistribute: boolean;
  /** May change status / convert (everyone who can see the lead, except read-only viewers). */
  canWork: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targets, setTargets] = useState<string[]>([]);
  const [converting, setConverting] = useState<Lead | null>(null);

  const open = useMemo(() => leads.filter((l) => l.status !== 'CONVERTED'), [leads]);
  const unassigned = open.filter((l) => !l.assignedToId);
  const allSelected = open.length > 0 && open.every((l) => selected.has(l.id));

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const run = (fn: () => Promise<{ success: boolean; message: string }>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(res.message);
        after?.();
        router.refresh();
      } else toast.error(res.message);
    });

  const distribute = (leadIds: string[]) => {
    if (leadIds.length === 0) return toast.error('Select at least one lead.');
    if (targets.length === 0) return toast.error('Pick at least one Relations Officer.');
    run(() => distributeLeads(leadIds, targets), () => setSelected(new Set()));
  };

  return (
    <>
      {canDistribute && (
        <section className="bg-white rounded-xl shadow-card border border-gray-100 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Shuffle className="w-4 h-4" /> Distribute leads to Relations Officers</h3>
              <p className="text-xs text-gray-500">
                {unassigned.length} unassigned · pick one officer to assign, or several to share evenly (balanced by each officer&apos;s open workload).
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy || unassigned.length === 0} onClick={() => distribute(unassigned.map((l) => l.id))} className="gap-1.5">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
                All unassigned ({unassigned.length})
              </Button>
              <Button size="sm" disabled={busy || selected.size === 0} onClick={() => distribute([...selected])} className="gap-1.5">
                <Send className="w-3.5 h-3.5" /> Assign selected ({selected.size})
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {officers.map((o) => {
              const on = targets.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setTargets((t) => (on ? t.filter((x) => x !== o.id) : [...t, o.id]))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${on ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary'}`}
                >
                  {o.fullName}
                  <span className={`ml-1 ${on ? 'text-white/70' : 'text-gray-400'}`}>{o.role === 'SUB_AGENT' ? 'agent' : 'RO'}</span>
                </button>
              );
            })}
            {officers.length === 0 && <p className="text-xs text-gray-500">No active Relations Officers yet - add them from Staff.</p>}
          </div>
        </section>
      )}

      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                {canDistribute && (
                  <th className="pl-4 py-3 w-8">
                    <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(open.map((l) => l.id)))} aria-label="Select all" />
                  </th>
                )}
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Interested In</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Relations Officer</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((l) => {
                const done = l.status === 'CONVERTED';
                return (
                  <tr key={l.id} className={`transition-colors ${selected.has(l.id) ? 'bg-primary/5' : 'hover:bg-gray-50/60'}`}>
                    {canDistribute && (
                      <td className="pl-4 py-3.5">
                        {!done && <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} aria-label={`Select ${l.fullName}`} />}
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900">{l.fullName}</p>
                      {l.nationality && <p className="text-[11px] text-gray-500">{l.nationality}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {l.phone}</span>
                        {l.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {l.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-900">{l.interestedIn}</p>
                      {l.interestedCountry && <p className="text-[11px] text-gray-500">{l.interestedCountry}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">{SOURCE_LABEL[l.source]}</td>
                    <td className="px-4 py-3.5 text-xs">
                      {canDistribute && !done ? (
                        <Select
                          value={l.assignedToId ?? ''}
                          disabled={busy}
                          onChange={(e) => run(() => updateLead(l.id, { assignedToId: e.target.value || null }))}
                          className="h-8 text-xs min-w-[150px]"
                        >
                          <option value="">- Unassigned -</option>
                          {officers.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
                        </Select>
                      ) : (
                        <span className={l.assignedToName ? 'text-gray-700' : 'text-amber-700'}>{l.assignedToName ?? 'Unassigned'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      {canWork && !done ? (
                        <Select
                          value={l.status}
                          disabled={busy}
                          onChange={(e) => run(() => updateLead(l.id, { status: e.target.value }))}
                          className={`h-8 text-xs font-medium ${STATUS_BADGE[l.status] ?? ''}`}
                        >
                          {WORKABLE.map((st) => <option key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase()}</option>)}
                        </Select>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[l.status] ?? 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {done && l.convertedStudentId ? (
                        <Link href={`/students/${l.convertedStudentId}`} className="text-xs text-primary hover:underline whitespace-nowrap">Open student →</Link>
                      ) : canWork && l.status !== 'LOST' ? (
                        <Button size="sm" variant="outline" onClick={() => setConverting(l)} className="gap-1 h-8 text-xs whitespace-nowrap">
                          <GraduationCap className="w-3.5 h-3.5" /> To student
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={canDistribute ? 9 : 8} className="text-center py-12 text-gray-500">
                    No leads here yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlideInPanel
        isOpen={converting !== null}
        onClose={() => setConverting(null)}
        title={converting ? `Convert · ${converting.fullName}` : 'Convert'}
        description="Creates the student record, credited to the lead's Relations Officer. Details captured on the lead are pre-filled."
      >
        {converting && <ConvertLeadForm lead={converting} onDone={() => setConverting(null)} />}
      </SlideInPanel>
    </>
  );
}
