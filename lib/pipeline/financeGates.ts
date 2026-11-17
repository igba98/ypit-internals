import { FinanceApproval, FinanceCheckpoint, PipelineStage } from '@/types';

/**
 * Leaving these stages needs the named Finance checkpoint approved first.
 * Mirrors CHECKPOINT_GATES in the backend's finance/approvals service - the
 * backend is the gate, this is so the officer sees why before clicking.
 */
export const CHECKPOINT_GATES: Partial<Record<PipelineStage, FinanceCheckpoint>> = {
  PAYMENT_CONFIRMED: 'ADMISSION',
  TRAVEL_PLANNING: 'TRAVEL_CLEARANCE',
  TRAVELLED: 'FINAL_SETTLEMENT',
};

export const CHECKPOINT_LABEL: Record<FinanceCheckpoint, string> = {
  INITIAL_PAYMENT: 'initial payment',
  ADMISSION: 'admission funds',
  TRAVEL_CLEARANCE: 'travel clearance',
  FINAL_SETTLEMENT: 'final settlement',
};

/**
 * The Finance sign-off holding this student in their current stage, or null
 * when nothing is. Returns null when the approvals aren't loaded, so the
 * button behaves as before rather than locking on missing data.
 */
export function pendingFinanceGate(
  stage: PipelineStage,
  approvals: FinanceApproval[] | null | undefined,
): FinanceCheckpoint | null {
  if (!approvals) return null;
  const gate = CHECKPOINT_GATES[stage];
  if (!gate) return null;
  const row = approvals.find((a) => a.checkpoint === gate);
  return row?.status === 'APPROVED' ? null : gate;
}
