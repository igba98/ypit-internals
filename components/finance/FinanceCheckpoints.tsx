import { ShieldCheck, ShieldAlert, ShieldX, Circle } from 'lucide-react';
import { FinanceApproval, FinanceCheckpoint, PipelineStage } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';

/** The four sign-offs, in the order the student meets them, and where each is raised. */
const ORDER: { key: FinanceCheckpoint; label: string; raisedAt: PipelineStage }[] = [
  { key: 'INITIAL_PAYMENT', label: 'Initial payment', raisedAt: 'PAYMENT_PENDING' },
  { key: 'ADMISSION', label: 'Admission funds', raisedAt: 'PAYMENT_CONFIRMED' },
  { key: 'TRAVEL_CLEARANCE', label: 'Travel clearance', raisedAt: 'TRAVEL_PLANNING' },
  { key: 'FINAL_SETTLEMENT', label: 'Final settlement', raisedAt: 'TRAVELLED' },
];

const STAGE_ORDER: PipelineStage[] = [
  'LEAD',
  'COUNSELING',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'APPLICATION_SUBMITTED',
  'UNIVERSITY_ACCEPTED',
  'TRAVEL_PLANNING',
  'TRAVELLED',
  'MONITORING',
];

/**
 * Where Finance has got to on this student. Shown to the officer so they know
 * what they are waiting on before they try to advance the stage.
 */
export function FinanceCheckpoints({
  approvals,
  outstanding,
  pipelineStage,
}: {
  approvals: FinanceApproval[];
  outstanding: number | null;
  /** Lets a checkpoint the student already passed read correctly. */
  pipelineStage?: PipelineStage;
}) {
  if (approvals.length === 0) return null;
  const byKey = new Map(approvals.map((a) => [a.checkpoint, a]));
  const waiting = approvals.find((a) => a.status === 'PENDING');
  const held = approvals.find((a) => a.status === 'REJECTED');

  return (
    <section className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-gray-900">Finance sign-off</h3>
        {outstanding !== null && (
          <span className={`text-xs font-medium ${outstanding > 0 ? 'text-amber-700' : 'text-green-700'}`}>
            {outstanding > 0 ? `${formatCurrency(outstanding)} outstanding` : 'nothing outstanding'}
          </span>
        )}
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ORDER.map((step) => {
          const row = byKey.get(step.key);
          // Students who were already past a stage when checkpoints shipped
          // have no row there - "not reached" would read as wrong.
          const alreadyPast =
            !row &&
            pipelineStage !== undefined &&
            STAGE_ORDER.indexOf(pipelineStage) > STAGE_ORDER.indexOf(step.raisedAt);
          const status = row?.status ?? (alreadyPast ? 'PASSED_EARLIER' : 'NOT_REACHED');
          const tone =
            status === 'APPROVED'
              ? 'border-green-200 bg-green-50/60'
              : status === 'PENDING'
                ? 'border-amber-200 bg-amber-50/60'
                : status === 'REJECTED'
                  ? 'border-red-200 bg-red-50/60'
                  : 'border-gray-200 bg-gray-50/60';
          const Icon =
            status === 'APPROVED'
              ? ShieldCheck
              : status === 'PENDING'
                ? ShieldAlert
                : status === 'REJECTED'
                  ? ShieldX
                  : Circle;
          const iconTone =
            status === 'APPROVED'
              ? 'text-green-700'
              : status === 'PENDING'
                ? 'text-amber-700'
                : status === 'REJECTED'
                  ? 'text-red-700'
                  : 'text-gray-300';
          return (
            <li key={step.key} className={`rounded-lg border px-3 py-2.5 ${tone}`}>
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${iconTone}`} />
                <p className="text-xs font-semibold text-gray-900">{step.label}</p>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {status === 'APPROVED'
                  ? `Approved${row?.decidedByName ? ` by ${row.decidedByName}` : ''}${row?.decidedAt ? ` · ${formatDate(row.decidedAt)}` : ''}`
                  : status === 'PENDING'
                    ? 'Waiting on Finance'
                    : status === 'REJECTED'
                      ? 'Held back by Finance'
                      : status === 'PASSED_EARLIER'
                        ? 'Passed before this check existed'
                        : 'Not reached yet'}
              </p>
              {row?.notes && <p className="text-[11px] text-gray-500 mt-1">{row.notes}</p>}
            </li>
          );
        })}
      </ol>

      {held ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-3 py-2 mt-3">
          Finance has held this student back. Sort out what the note says, then Finance can approve.
        </p>
      ) : waiting ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-3 py-2 mt-3">
          This student cannot move past the current stage until Finance approves.
        </p>
      ) : null}
    </section>
  );
}
