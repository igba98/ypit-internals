'use client';

import { useState, useTransition } from 'react';
import { FinanceApproval, Student, Session, TravelRecord } from '@/types';
import { getTransition } from '@/lib/pipeline/transitions';
import { canAdvance } from '@/lib/pipeline/permissions';
import { allTravelStepsDone } from '@/lib/pipeline/travelSteps';
import {
  CHECKPOINT_LABEL,
  pendingFinanceGate,
} from '@/lib/pipeline/financeGates';
import { AdvanceStageModal } from './AdvanceStageModal';
import { listActiveStaff, StaffOption } from '@/lib/actions/staffActions';
import { Button } from '@/components/ui/button';
import { ChevronRight, Lock } from 'lucide-react';

interface Props {
  student: Student;
  session: Session;
  /** Travel record for this student, used to check the TRAVEL_PLANNING → TRAVELLED gate. */
  travel?: TravelRecord | null;
  /** Finance checkpoints, so the officer sees a pending sign-off before clicking. */
  approvals?: FinanceApproval[] | null;
  size?: 'sm' | 'default';
}

export function AdvanceStageButton({ student, session, travel, approvals, size = 'default' }: Props) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, startTransition] = useTransition();
  const transition = getTransition(student.pipelineStage);

  /**
   * Load the real staff list before opening, so "assign next owner" offers the
   * officers who actually exist. Done in the handler rather than an effect.
   */
  const openModal = () => {
    startTransition(async () => {
      setStaff(await listActiveStaff());
      setOpen(true);
    });
  };

  if (!transition) {
    return <span className="text-xs text-gray-400">No further stage</span>;
  }

  const allowed = canAdvance(session.role, student.pipelineStage);

  let gatedReason: string | null = null;
  if (transition.to === 'TRAVELLED') {
    if (!travel || !travel.travelStepStatus || !allTravelStepsDone(travel.travelStepStatus)) {
      gatedReason = 'Complete all 4 travel sub-steps first';
    }
  }
  // A Finance sign-off can hold the student in this stage - say so on the
  // button rather than letting the click fail.
  const financeGate = pendingFinanceGate(student.pipelineStage, approvals);
  if (!gatedReason && financeGate) {
    gatedReason = `Waiting on Finance: ${CHECKPOINT_LABEL[financeGate]} (Finance → Approvals)`;
  }

  const tooltip = !allowed
    ? `${transition.allowedRoles.join(', ').toLowerCase()} must advance this student`
    : gatedReason ?? '';

  if (!allowed || gatedReason) {
    return (
      <Button size={size} variant="outline" disabled title={tooltip}>
        <Lock size={14} className="mr-1" />
        {transition.label}
      </Button>
    );
  }

  return (
    <>
      <Button size={size} onClick={openModal} disabled={loading}>
        {transition.label}
        <ChevronRight size={14} className="ml-1" />
      </Button>
      {open && (
        <AdvanceStageModal
          student={student}
          session={session}
          transition={transition}
          staff={staff}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}