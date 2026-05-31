'use client';

import { useActionState, useEffect, useState } from 'react';
import { addTask } from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { mockUsers } from '@/lib/mock/mockUsers';
import { CustomSelect } from '@/components/ui/custom-select';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiAttachmentField } from '@/components/shared/MultiAttachmentField';

const PERSONAL = '__personal__';

export function CreateTaskForm({ onSuccess, currentUserId }: { onSuccess: () => void; currentUserId: string }) {
  const [state, formAction, isPending] = useActionState(addTask, null);
  const [assignee, setAssignee] = useState<string>(PERSONAL);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const isPersonal = assignee === PERSONAL || assignee === currentUserId;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input id="title" name="title" placeholder="e.g. Follow up on student visa…" required />
        {state?.errors?.title && <p className="text-red-500 text-xs">{state.errors.title[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detailed Description *</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Explain what completion looks like, the inputs, and any constraints."
          required
        />
        {state?.errors?.description && <p className="text-red-500 text-xs">{state.errors.description[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <CustomSelect
            name="priority"
            required
            defaultValue="MEDIUM"
            options={[
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'High', value: 'HIGH' },
              { label: 'Urgent!', value: 'URGENT' },
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

      <div className="space-y-2">
        <Label htmlFor="assignedToId">Assign To</Label>
        {/*
          CustomSelect always renders a hidden input with name=_assigneeDisplay.
          We use a separate hidden input for the actual assignedToId so we can
          submit an empty string (→ isSelfAssign=true on server) for personal tasks.
        */}
        <CustomSelect
          name="_assigneeDisplay"
          defaultValue={PERSONAL}
          options={[
            { label: 'Me (personal task)', value: PERSONAL },
            ...mockUsers
              .filter((u) => u.id !== currentUserId)
              .map((u) => ({ label: `${u.fullName} (${u.role})`, value: u.id })),
          ]}
          onChange={(v) => setAssignee(v)}
        />
        {/* Actual form field: empty string when personal (server reads !assigneeIdRaw as isSelfAssign) */}
        <input type="hidden" name="assignedToId" value={isPersonal ? '' : assignee} />
        <p className="text-[11px] text-gray-500">
          {isPersonal
            ? 'Personal tasks close on submit - no review.'
            : 'The assignee will be notified. You will review their submission.'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="Comma-separated, e.g. Q2, Finance, Urgent" />
      </div>

      <MultiAttachmentField name="reference" label="Reference materials (optional)" />

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isPersonal ? 'Add Personal Task' : 'Assign Task'}
        </Button>
      </div>
    </form>
  );
}
