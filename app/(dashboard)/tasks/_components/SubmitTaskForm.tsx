'use client';

import { useActionState, useEffect } from 'react';
import { submitTaskReport } from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';
import { MultiAttachmentField } from '@/components/shared/MultiAttachmentField';
import { toast } from 'sonner';
import { Task } from '@/types';
import { isPersonalTask } from '@/lib/tasks/permissions';

export function SubmitTaskForm({ task, onSuccess }: { task: Task; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(submitTaskReport, null);
  const personal = isPersonalTask(task);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="taskId" value={task.id} />

      <div className="bg-gray-50 border border-gray-100 p-3 rounded-md mb-4">
        <h4 className="font-urbanist font-bold text-gray-900 line-clamp-1">{task.title}</h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary *</Label>
        <Input id="summary" name="summary" placeholder="One sentence: where things stand" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="progressMade">Progress made *</Label>
        <Textarea
          id="progressMade"
          name="progressMade"
          placeholder="What was accomplished against this task?"
          required
          className="h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="percentageComplete">Completion *</Label>
          <CustomSelect
            name="percentageComplete"
            required
            defaultValue="100"
            options={[
              { label: '0% — Just started', value: '0' },
              { label: '25%', value: '25' },
              { label: '50%', value: '50' },
              { label: '75%', value: '75' },
              { label: '100% — Done', value: '100' },
            ]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextActions">Next actions</Label>
        <Input id="nextActions" name="nextActions" placeholder="What would you do next?" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blockers">Blockers / delays</Label>
        <Textarea id="blockers" name="blockers" placeholder="Waiting on anyone or anything?" className="h-16" />
      </div>

      <MultiAttachmentField name="deliverable" label="Deliverables (optional)" />

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting…' : personal ? 'Mark Complete' : 'Submit for review'}
        </Button>
      </div>
    </form>
  );
}
