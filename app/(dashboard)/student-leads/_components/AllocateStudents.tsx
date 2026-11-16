'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Search, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { allocateStudents } from '@/lib/actions/studentActions';

export interface AllocatableStudent {
  id: string;
  fullName: string;
  registrationNumber: string;
  pipelineStage: string;
  marketingStaffId?: string | null;
  officerName?: string | null;
}

interface Officer {
  id: string;
  fullName: string;
  role: string;
}

/**
 * Allocate students to Relations Officers (client report, Nov 2026). The
 * distribute panel above only covers leads; students entered before the RO
 * roles existed carry no officer and had nowhere to be allocated from.
 */
export function AllocateStudents({
  students,
  officers,
}: {
  students: AllocatableStudent[];
  officers: Officer[];
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [officerId, setOfficerId] = useState('');

  const unassignedCount = students.filter((s) => !s.marketingStaffId).length;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return students.filter(
      (s) =>
        (!onlyUnassigned || !s.marketingStaffId) &&
        (!term ||
          s.fullName.toLowerCase().includes(term) ||
          s.registrationNumber.toLowerCase().includes(term)),
    );
  }, [students, onlyUnassigned, q]);

  const allShown = rows.length > 0 && rows.every((r) => picked.includes(r.id));
  const toggleAll = () =>
    setPicked(allShown ? [] : rows.map((r) => r.id));
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = () => {
    if (picked.length === 0) {
      toast.error('Pick at least one student.');
      return;
    }
    if (!officerId) {
      toast.error('Choose the Relations Officer.');
      return;
    }
    startTransition(async () => {
      const res = await allocateStudents(picked, officerId);
      if (res.success) {
        toast.success(res.message);
        setPicked([]);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold text-gray-900">Allocate students to Relations Officers</h3>
          <p className="text-[11px] text-gray-500">
            Every student in the pipeline, including the ones entered before the officers were set
            up. Tick the ones to move, choose the officer, then Allocate.
            {unassignedCount > 0 ? ` ${unassignedCount} not yet allocated.` : ''}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => setOnlyUnassigned((v) => !v)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
            onlyUnassigned
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {onlyUnassigned ? `Unassigned only · ${unassignedCount}` : `All students · ${students.length}`}
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or registration number…" className="pl-9" />
        </div>
        <Select value={officerId} onChange={(e) => setOfficerId(e.target.value)} className="max-w-[220px]">
          <option value="">Choose an officer…</option>
          {officers.map((o) => (
            <option key={o.id} value={o.id}>{o.fullName}</option>
          ))}
        </Select>
        <Button onClick={submit} disabled={busy || picked.length === 0} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          Allocate {picked.length > 0 ? `(${picked.length})` : ''}
        </Button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-gray-50">
            <tr className="text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2.5 w-10">
                <input type="checkbox" checked={allShown} onChange={toggleAll} className="rounded" aria-label="Select all shown" />
              </th>
              <th className="px-4 py-2.5 font-medium">Student</th>
              <th className="px-4 py-2.5 font-medium">Stage</th>
              <th className="px-4 py-2.5 font-medium">Relations Officer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((s) => (
              <tr key={s.id} className={`hover:bg-gray-50/60 ${picked.includes(s.id) ? 'bg-primary/5' : ''}`}>
                <td className="px-4 py-2.5">
                  <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} className="rounded" aria-label={`Select ${s.fullName}`} />
                </td>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-900">{s.fullName}</p>
                  <p className="text-[11px] text-gray-500">{s.registrationNumber}</p>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600">
                  {s.pipelineStage.replace(/_/g, ' ').toLowerCase()}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {s.officerName ? (
                    <span className="text-gray-700">{s.officerName}</span>
                  ) : (
                    <span className="text-amber-700 font-medium">not allocated</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">
                  {onlyUnassigned ? 'Every student has an officer.' : 'Nothing matches that search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
