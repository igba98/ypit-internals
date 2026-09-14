'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StudentFollowUp, User } from '@/types';
import { formatDate } from '@/lib/utils';
import { completeFollowUpAction } from '@/lib/actions/studentFollowUpActions';
import { PARTY } from '../../students/[id]/_components/FollowUpSection';

/** Module-level: date maths outside render (react-hooks/purity). */
function dueState(iso: string | null | undefined): 'overdue' | 'today' | 'upcoming' | 'none' {
  if (!iso) return 'none';
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 86_400_000;
  const t = new Date(iso).getTime();
  if (t < start) return 'overdue';
  if (t < end) return 'today';
  return 'upcoming';
}

const DUE_CLS = {
  overdue: 'text-red-600 font-semibold',
  today: 'text-amber-700 font-semibold',
  upcoming: 'text-gray-600',
  none: 'text-gray-400',
};

export function FollowUpBoard({
  items,
  staff,
  status,
  assignee,
  currentUserId,
}: {
  items: StudentFollowUp[];
  staff: Pick<User, 'id' | 'fullName' | 'role'>[];
  status: 'OPEN' | 'DONE' | 'ALL';
  assignee: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [q, setQ] = useState('');

  const nav = (next: { status?: string; assignee?: string }) => {
    const p = new URLSearchParams();
    const s = next.status ?? status;
    const a = next.assignee ?? assignee;
    if (s !== 'OPEN') p.set('status', s);
    if (a) p.set('assignee', a);
    router.push(`/follow-ups${p.toString() ? `?${p}` : ''}`);
  };

  const term = q.trim().toLowerCase();
  const rows = items.filter(
    (f) =>
      !term ||
      [f.student?.fullName, f.student?.registrationNumber, f.pendingAction, f.assignedToName, f.contactName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
  );

  const onDone = (f: StudentFollowUp) => {
    setBusyId(f.id);
    startTransition(async () => {
      const res = await completeFollowUpAction(f.id, f.studentId);
      setBusyId(null);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {(['OPEN', 'DONE', 'ALL'] as const).map((s) => (
            <button
              key={s}
              onClick={() => nav({ status: s })}
              className={`px-3 py-1.5 text-xs font-medium ${status === s ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {s === 'OPEN' ? 'Pending' : s === 'DONE' ? 'Completed' : 'All'}
            </button>
          ))}
        </div>
        <Select value={assignee} onChange={(e) => nav({ assignee: e.target.value })} className="w-52">
          <option value="">Everyone&apos;s actions</option>
          <option value="me">My actions</option>
          {staff.filter((u) => u.id !== currentUserId).map((u) => (
            <option key={u.id} value={u.id}>{u.fullName}</option>
          ))}
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student, action, owner…" className="pl-9" />
        </div>
        <span className="text-xs text-gray-500">{rows.length} item{rows.length === 1 ? '' : 's'}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Pending action</th>
              <th className="px-4 py-3 font-medium">Involves</th>
              <th className="px-4 py-3 font-medium">Responsible</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Logged</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((f) => {
              const d = dueState(f.nextFollowUp);
              const party = PARTY[f.party ?? 'STUDENT'];
              return (
                <tr key={f.id} className={`transition-colors ${d === 'overdue' && f.actionStatus === 'OPEN' ? 'bg-red-50/40' : 'hover:bg-gray-50/60'}`}>
                  <td className={`px-4 py-3.5 text-xs whitespace-nowrap ${DUE_CLS[d]}`}>
                    {f.nextFollowUp ? formatDate(f.nextFollowUp) : 'No date'}
                    {d === 'overdue' && f.actionStatus === 'OPEN' && <p className="text-[10px] uppercase tracking-wider">Overdue</p>}
                    {d === 'today' && <p className="text-[10px] uppercase tracking-wider">Today</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    {f.student ? (
                      <Link href={`/students/${f.student.id}`} className="font-medium text-gray-900 hover:text-primary">
                        {f.student.fullName}
                        <p className="text-[11px] text-gray-500 font-normal">{f.student.registrationNumber}</p>
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-800 max-w-[320px]">
                    <p className={f.actionStatus === 'DONE' ? 'line-through text-gray-400' : ''}>{f.pendingAction}</p>
                    <p className="text-[11px] text-gray-500 truncate" title={f.notes}>{f.notes}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${party.cls}`}>
                      {party.label}
                    </span>
                    {f.contactName && <p className="text-[11px] text-gray-500 mt-0.5">{f.contactName}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-700">{f.assignedToName ?? '-'}</td>
                  <td className="px-4 py-3.5">{f.student && <StatusBadge status={f.student.pipelineStage} variant="pipeline" />}</td>
                  <td className="px-4 py-3.5 text-[11px] text-gray-500 whitespace-nowrap">
                    {formatDate(f.createdAt)}<br />{f.createdByName}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {f.actionStatus === 'OPEN' ? (
                      <button
                        onClick={() => onDone(f)}
                        disabled={busyId === f.id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
                      >
                        {busyId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Done
                      </button>
                    ) : (
                      <span className="text-[11px] text-green-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {f.completedAt ? formatDate(f.completedAt) : 'done'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">
                  {items.length === 0
                    ? status === 'OPEN'
                      ? 'No pending actions. Log a follow-up on a student and tick "Add a pending action" to see it here.'
                      : 'Nothing here yet.'
                    : 'Nothing matches that search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
