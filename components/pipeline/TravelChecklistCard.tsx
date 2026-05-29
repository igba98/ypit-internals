'use client';

import { useState } from 'react';
import { Session, TravelRecord, TravelSubStep, TravelSubStepStatus } from '@/types';
import { TRAVEL_STEP_DEFS, allTravelStepsDone } from '@/lib/pipeline/travelSteps';
import { TravelStepModal } from './TravelStepModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, CircleDashed } from 'lucide-react';

interface Props {
  studentId: string;
  studentName: string;
  travel: TravelRecord;
  session: Session;
}

export function TravelChecklistCard({ studentId, studentName, travel, session }: Props) {
  const [activeStep, setActiveStep] = useState<TravelSubStep | null>(null);

  const status = travel.travelStepStatus ?? { passport: 'NOT_STARTED', visa: 'NOT_STARTED', flight: 'NOT_STARTED', arrival: 'NOT_STARTED' };
  const doneCount = TRAVEL_STEP_DEFS.filter(d => status[d.key] === 'DONE').length;
  const allDone = allTravelStepsDone(status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Travel Checklist</span>
          <span className="text-sm font-normal text-gray-500">{doneCount}/4 complete{allDone && ' ✓'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-gray-100">
          {TRAVEL_STEP_DEFS.map(def => (
            <li key={def.key} className="py-3 flex items-center gap-3">
              <StepIcon status={status[def.key]} />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{def.label}</p>
                <p className="text-xs text-gray-500">{labelForStatus(status[def.key])}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveStep(def.key)}>Update</Button>
            </li>
          ))}
        </ul>
        {activeStep && (
          <TravelStepModal
            studentId={studentId}
            studentName={studentName}
            step={activeStep}
            currentStatus={status[activeStep]}
            travel={travel}
            session={session}
            open={true}
            onClose={() => setActiveStep(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function StepIcon({ status }: { status: TravelSubStepStatus }) {
  if (status === 'DONE') return <CheckCircle2 size={20} className="text-green-600" />;
  if (status === 'IN_PROGRESS') return <CircleDashed size={20} className="text-yellow-600" />;
  return <Circle size={20} className="text-gray-300" />;
}

function labelForStatus(s: TravelSubStepStatus): string {
  if (s === 'DONE') return 'Done';
  if (s === 'IN_PROGRESS') return 'In progress';
  return 'Not started';
}