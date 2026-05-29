'use client';

import { useState } from 'react';
import { Student, Session, TravelRecord } from '@/types';
import { getTransition } from '@/lib/pipeline/transitions';
import { canAdvance } from '@/lib/pipeline/permissions';
import { allTravelStepsDone } from '@/lib/pipeline/travelSteps';
import { AdvanceStageModal } from './AdvanceStageModal';
import { Button } from '@/components/ui/button';
import { ChevronRight, Lock } from 'lucide-react';

interface Props {
  student: Student;
  session: Session;
  /** Travel record for this student, used to check the TRAVEL_PLANNING → TRAVELLED gate. */
  travel?: TravelRecord | null;
  size?: 'sm' | 'default';
}

export function AdvanceStageButton({ student, session, travel, size = 'default' }: Props) {
  const [open, setOpen] = useState(false);
  const transition = getTransition(student.pipelineStage);

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
      <Button size={size} onClick={() => setOpen(true)}>
        {transition.label}
        <ChevronRight size={14} className="ml-1" />
      </Button>
      {open && (
        <AdvanceStageModal
          student={student}
          session={session}
          transition={transition}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}