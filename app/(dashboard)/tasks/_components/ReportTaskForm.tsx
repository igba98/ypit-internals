'use client';

import { useActionState, useEffect } from 'react';
import { submitTaskReport } from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';
import { toast } from 'sonner';
import { Task } from '@/types';

export function ReportTaskForm({ task, onSuccess }: { task: Task, onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(submitTaskReport, null);

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
        <Label htmlFor="taskSummary">Executive Summary *</Label>
        <Input id="taskSummary" name="taskSummary" placeholder="Brief 1-sentence summary of current state" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="progressMade">Detailed Progress Made *</Label>
        <Textarea id="progressMade" name="progressMade" placeholder="What explicitly was accomplished against this task today?" required className="h-20" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="percentageComplete">Completion (%) *</Label>
          <CustomSelect 
            name="percentageComplete" 
            required 
            defaultValue={task.endOfDayReport ? task.endOfDayReport.percentageComplete.toString() : "50"}
            options={[
              { label: "0% - Just Started", value: "0" },
              { label: "25% - Quarter Done", value: "25" },
              { label: "50% - Halfway There", value: "50" },
              { label: "75% - Almost Done", value: "75" },
              { label: "100% - Fully Completed", value: "100" }
            ]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tomorrowPlan">Next Actions / Plan *</Label>
        <Input id="tomorrowPlan" name="tomorrowPlan" placeholder="What will be done next to push this forward?" required />
      </div>
      
      <div className="space-y-2 pb-4">
        <Label htmlFor="blockers">Blockers / Delays (Optional)</Label>
        <Textarea id="blockers" name="blockers" placeholder="Are you waiting on external factors or experiencing delays?" className="h-16" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Task Report"}
        </Button>
      </div>
    </form>
  );
}
