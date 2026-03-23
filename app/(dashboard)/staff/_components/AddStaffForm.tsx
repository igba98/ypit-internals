'use client';

import { useActionState, useEffect } from 'react';
import { addStaff } from '@/lib/actions/staffActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export function AddStaffForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(addStaff, null);

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
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
        {state?.errors?.fullName && <p className="text-red-500 text-xs">{state.errors.fullName[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input id="email" name="email" type="email" placeholder="jane@ypit.co.tz" required />
        {state?.errors?.email && <p className="text-red-500 text-xs">{state.errors.email[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label htmlFor="role">Role Authorization *</Label>
          <Select id="role" name="role" required defaultValue="MARKETING_STAFF">
            <option value="MANAGING_DIRECTOR">Managing Director</option>
            <option value="MARKETING_MANAGER">Marketing Manager</option>
            <option value="MARKETING_STAFF">Marketing Staff</option>
            <option value="FINANCE">Finance</option>
            <option value="ADMISSIONS">Admissions</option>
            <option value="TRAVEL">Travel</option>
            <option value="OPERATIONS">Operations</option>
            <option value="SUB_AGENT">Sub Agent</option>
          </Select>
          {state?.errors?.role && <p className="text-red-500 text-xs">{state.errors.role[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input id="department" name="department" placeholder="e.g. Marketing" required />
          {state?.errors?.department && <p className="text-red-500 text-xs">{state.errors.department[0]}</p>}
        </div>
      </div>

       <div className="space-y-2 pb-4">
        <Label htmlFor="status">Initial Status</Label>
        <Select id="status" name="status" required defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding Staff..." : "Add Staff Member"}
        </Button>
      </div>
    </form>
  );
}
