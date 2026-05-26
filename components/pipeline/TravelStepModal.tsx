'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Session, StageTransitionPayload, TravelSubStep, TravelSubStepStatus } from '@/types';
import { getTravelStepDef } from '@/lib/pipeline/travelSteps';
import { advanceTravelStep } from '@/lib/actions/pipelineActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  studentId: string;
  studentName: string;
  step: TravelSubStep;
  currentStatus: TravelSubStepStatus;
  session: Session;
  open: boolean;
  onClose: () => void;
}

export function TravelStepModal({ studentId, studentName, step, currentStatus, session, open, onClose }: Props) {
  const def = getTravelStepDef(step);
  const [values, setValues] = useState<StageTransitionPayload>({});
  const [isPending, startTransition] = useTransition();
  const [targetStatus, setTargetStatus] = useState<TravelSubStepStatus>(currentStatus === 'NOT_STARTED' ? 'IN_PROGRESS' : 'DONE');

  const preview = useMemo(() => {
    if (!def || targetStatus !== 'DONE') return null;
    return def.messageTemplate({ studentName, capturedData: values });
  }, [def, targetStatus, studentName, values]);

  function handleSubmit() {
    if (!def) return;
    startTransition(async () => {
      const result = await advanceTravelStep({ studentId, step, newStatus: targetStatus, capturedData: values, session: { userId: session.userId, fullName: session.fullName, role: session.role } });
      if (result.success) { toast.success(result.message); onClose(); }
      else toast.error(result.message);
    });
  }

  if (!def) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Update: {def.label}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Set status to</Label>
            <select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value as TravelSubStepStatus)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="IN_PROGRESS">In progress (silent)</option>
              <option value="DONE">Done (sends notification)</option>
            </select>
          </div>

          {targetStatus === 'DONE' && def.requiredFields.map(field => (
            <div key={field.key}>
              <Label>{field.label}{field.required ? ' *' : ''}</Label>
              {field.kind === 'date' ? (
                <Input type="date" value={String(values[field.key] ?? '')} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
              ) : field.kind === 'textarea' ? (
                <Textarea value={String(values[field.key] ?? '')} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
              ) : field.kind === 'boolean' ? (
                <input type="checkbox" checked={Boolean(values[field.key])} onChange={(e) => setValues({ ...values, [field.key]: e.target.checked })} />
              ) : (
                <Input value={String(values[field.key] ?? '')} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
              )}
            </div>
          ))}

          {preview && (
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Notification preview</p>
              <p className="text-sm text-gray-800">{preview}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}