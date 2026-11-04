'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { BadgeCheck, Ban, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { FinanceApproval, FinanceCheckpoint } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import {
  approveCheckpoint,
  rejectCheckpoint,
} from '@/lib/actions/financeApprovalActions';

export const CHECKPOINT_LABEL: Record<FinanceCheckpoint, string> = {
  INITIAL_PAYMENT: 'Initial payment',
  ADMISSION: 'Admission funds',
  TRAVEL_CLEARANCE: 'Travel clearance',
  FINAL_SETTLEMENT: 'Final settlement',
};

/** What each checkpoint holds up, so Finance knows what is waiting on them. */
const CHECKPOINT_BLOCKS: Record<FinanceCheckpoint, string> = {
  INITIAL_PAYMENT: 'confirmed when the first payment is recorded',
  ADMISSION: 'blocks the application being submitted',
  TRAVEL_CLEARANCE: 'blocks the ticket and travel',
  FINAL_SETTLEMENT: 'blocks closing the student into monitoring',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

/** Checkpoints that may not be approved while any money is outstanding. */
const STRICT: FinanceCheckpoint[] = ['TRAVEL_CLEARANCE', 'FINAL_SETTLEMENT'];

export function ApprovalsQueue({ rows }: { rows: FinanceApproval[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [deciding, setDeciding] = useState<FinanceApproval | null>(null);
  const [mode, setMode] = useState<'approve' | 'reject'>('approve');
  const [text, setText] = useState('');

  const open = (row: FinanceApproval, m: 'approve' | 'reject') => {
    setDeciding(row);
    setMode(m);
    setText('');
  };

  const submit = () => {
    if (!deciding) return;
    if (mode === 'reject' && text.trim().length < 4) {
      toast.error('Say what is missing - the officer sees this.');
      return;
    }
    startTransition(async () => {
      const res =
        mode === 'approve'
          ? await approveCheckpoint(deciding.id, text)
          : await rejectCheckpoint(deciding.id, text);
      if (res.success) {
        toast.success(res.message);
        setDeciding(null);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const owes = deciding?.outstanding ?? 0;
  const strictBlocked =
    deciding !== null && mode === 'approve' && owes > 0 && STRICT.includes(deciding.checkpoint);

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">Approval queue</h2>
        <span className="text-xs text-gray-400">{rows.length} item(s)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Checkpoint</th>
              <th className="px-4 py-3 font-medium">Officer</th>
              <th className="px-4 py-3 font-medium text-right">Outstanding</th>
              <th className="px-4 py-3 font-medium">Raised</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const outstanding = r.outstanding ?? 0;
              return (
                <tr key={r.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    {r.student ? (
                      <Link href={`/students/${r.studentId}`} className="font-medium text-gray-900 hover:text-primary">
                        {r.student.fullName}
                      </Link>
                    ) : (
                      <span className="text-gray-500">{r.studentId}</span>
                    )}
                    <p className="text-[11px] text-gray-500">
                      {r.student?.registrationNumber}
                      {r.student ? ` · ${r.student.pipelineStage.replace(/_/g, ' ').toLowerCase()}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{CHECKPOINT_LABEL[r.checkpoint]}</p>
                    <p className="text-[11px] text-gray-500">{CHECKPOINT_BLOCKS[r.checkpoint]}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.student?.marketingStaff?.fullName ?? <span className="text-gray-300">-</span>}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${outstanding > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {r.outstanding === null ? <span className="text-gray-300">no record</span> : formatCurrency(outstanding)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(r.raisedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[r.status]}`}>
                      {r.status.toLowerCase()}
                    </span>
                    {r.notes && <p className="text-[11px] text-gray-500 mt-0.5 max-w-[220px]">{r.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {r.status === 'APPROVED' ? (
                      <span className="text-[11px] text-gray-500">
                        {r.decidedByName}
                        {r.decidedAt ? ` · ${formatDate(r.decidedAt)}` : ''}
                      </span>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => open(r, 'approve')} disabled={busy} className="gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => open(r, 'reject')} disabled={busy} className="gap-1.5 text-red-700 ml-1">
                          <Ban className="w-3.5 h-3.5" /> Hold
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  Nothing waiting on Finance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={deciding !== null}
        onClose={() => setDeciding(null)}
        title={
          deciding
            ? `${mode === 'approve' ? 'Approve' : 'Hold'} · ${CHECKPOINT_LABEL[deciding.checkpoint]}`
            : ''
        }
        description={deciding?.student?.fullName ?? ''}
      >
        {deciding && (
          <div className="space-y-4">
            <div className={`rounded-lg border p-3 text-sm ${owes > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-green-50 border-green-200 text-green-900'}`}>
              {deciding.outstanding === null
                ? 'This student has no payment record yet.'
                : owes > 0
                  ? `Still owes ${formatCurrency(owes)}.`
                  : 'Nothing outstanding.'}
              <p className="text-[11px] mt-1 opacity-80">{CHECKPOINT_BLOCKS[deciding.checkpoint]}</p>
            </div>

            {strictBlocked && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {CHECKPOINT_LABEL[deciding.checkpoint]} cannot be approved while money is outstanding.
                Record the payment first.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="ap-text">
                {mode === 'approve'
                  ? `Note${owes > 0 ? ' *' : ' (optional)'}`
                  : 'What is missing? *'}
              </Label>
              <Input
                id="ap-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === 'approve'
                    ? 'e.g. tuition falls due after admission'
                    : 'e.g. application fee receipt not received'
                }
              />
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => setDeciding(null)}>Cancel</Button>
              <Button
                onClick={submit}
                disabled={busy || strictBlocked}
                className={`gap-2 ${mode === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'approve' ? <BadgeCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                {mode === 'approve' ? 'Approve' : 'Hold back'}
              </Button>
            </div>
          </div>
        )}
      </SlideInPanel>
    </div>
  );
}
