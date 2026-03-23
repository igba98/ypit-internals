'use client';

import { useActionState, useEffect } from 'react';
import { addTask } from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { mockUsers } from '@/lib/mock/mockUsers';
import { CustomSelect } from '@/components/ui/custom-select';
import { DatePicker } from '@/components/ui/date-picker';

export function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(addTask, null);

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
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input id="title" name="title" placeholder="e.g. Follow up on student visa..." required />
        {state?.errors?.title && <p className="text-red-500 text-xs">{state.errors.title[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detailed Description *</Label>
        <Textarea id="description" name="description" placeholder="Explain the specific requirements expected for completion." required />
        {state?.errors?.description && <p className="text-red-500 text-xs">{state.errors.description[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label htmlFor="priority">Priority Level *</Label>
          <CustomSelect 
            name="priority" 
            required 
            defaultValue="MEDIUM" 
            options={[
              { label: "Low", value: "LOW" },
              { label: "Medium", value: "MEDIUM" },
              { label: "High", value: "HIGH" },
              { label: "Urgent!", value: "URGENT" }
            ]}
          />
          {state?.errors?.priority && <p className="text-red-500 text-xs">{state.errors.priority[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <DatePicker name="dueDate" required />
          {state?.errors?.dueDate && <p className="text-red-500 text-xs">{state.errors.dueDate[0]}</p>}
        </div>
      </div>

      <div className="space-y-2 pb-4">
        <Label htmlFor="assignedToId">Assign To *</Label>
        <CustomSelect 
          name="assignedToId" 
          required 
          placeholder="Select a staff member..."
          options={mockUsers.map(user => ({
            label: `${user.fullName} (${user.role})`,
            value: user.id
          }))}
        />
        {state?.errors?.assignedToId && <p className="text-red-500 text-xs">{state.errors.assignedToId[0]}</p>}
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Assigning Task..." : "Assign Task"}
        </Button>
      </div>
    </form>
  );
}
