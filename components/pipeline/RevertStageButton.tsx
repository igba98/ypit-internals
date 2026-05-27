'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Student, Session, PipelineStage, PIPELINE_ORDER, ROLES } from '@/types';
import { revertStage } from '@/lib/actions/pipelineActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Undo2 } from 'lucide-react';

interface Props {
  student: Student;
  session: Session;
}

export function RevertStageButton({ student, session }: Props) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<PipelineStage | ''>('');
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  if (session.role !== ROLES.MANAGING_DIRECTOR) return null;

  const currentIdx = PIPELINE_ORDER.indexOf(student.pipelineStage);
  const earlierStages = PIPELINE_ORDER.slice(0, currentIdx);
  if (earlierStages.length === 0) return null;

  function handleSubmit() {
    if (!target || !reason.trim()) {
      toast.error('Pick a target stage and provide a reason.');
      return;
    }
    startTransition(async () => {
      const result = await revertStage({
        studentId: student.id,
        toStage: target as PipelineStage,
        reason,
        session: { userId: session.userId, fullName: session.fullName, role: session.role },
      });
      if (result.success) { toast.success(result.message); setOpen(false); setTarget(''); setReason(''); }
      else toast.error(result.message);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Undo2 size={14} className="mr-1" /> Revert stage (MD)
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revert {student.fullName}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Revert to stage</Label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as PipelineStage)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {earlierStages.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Reason *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this student being moved back?" />
              <p className="text-xs text-gray-500 mt-1">The student & parents will NOT be notified. The target stage&apos;s team will be alerted in-app.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>{isPending ? 'Reverting…' : 'Revert'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}