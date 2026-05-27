'use client';

import { useActionState, useEffect, useState } from 'react';
import { reviewTask } from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Task } from '@/types';
import { CheckCircle2, MessageSquareWarning, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Decision = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

const OPTIONS: { value: Decision; label: string; description: string; icon: typeof CheckCircle2; tone: string }[] = [
  {
    value: 'APPROVE',
    label: 'Approve',
    description: 'Close the task as completed.',
    icon: CheckCircle2,
    tone: 'text-green-700 border-green-200 bg-green-50',
  },
  {
    value: 'REQUEST_CHANGES',
    label: 'Request changes',
    description: 'Send back for another round. Reason required.',
    icon: MessageSquareWarning,
    tone: 'text-amber-700 border-amber-200 bg-amber-50',
  },
  {
    value: 'REJECT',
    label: 'Reject',
    description: 'Terminal — task closes without completion. Reason required.',
    icon: XCircle,
    tone: 'text-red-700 border-red-200 bg-red-50',
  },
];

export function ReviewTaskForm({ task, onSuccess }: { task: Task; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(reviewTask, null);
  const [decision, setDecision] = useState<Decision>('APPROVE');

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const requiresNote = decision !== 'APPROVE';

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="decision" value={decision} />

      <div className="space-y-2">
        <Label>Decision *</Label>
        <div className="grid grid-cols-1 gap-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = decision === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDecision(opt.value)}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition',
                  active ? opt.tone : 'border-gray-200 bg-white hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-gray-600">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note {requiresNote ? '*' : '(optional)'}</Label>
        <Textarea
          id="note"
          name="note"
          required={requiresNote}
          placeholder={
            decision === 'APPROVE'
              ? 'Optional acknowledgement to the assignee.'
              : 'Be specific so the assignee knows what to change or why.'
          }
          className="h-24"
        />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Recording…' : `Submit decision: ${decision.replace('_', ' ')}`}
        </Button>
      </div>
    </form>
  );
}
