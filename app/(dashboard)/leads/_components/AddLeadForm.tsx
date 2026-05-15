'use client';

import { useActionState, useEffect } from 'react';
import { addLead } from '@/lib/actions/leadActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export function AddLeadForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(addLead, null);
  const fieldErrors = state?.errors ?? {};

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
      <h3 className="font-urbanist font-bold text-lg border-b pb-2 mb-4 mt-2">Employee Details</h3>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" name="fullName" placeholder="John Doe" required />
        {fieldErrors.fullName && <p className="text-xs text-red-600">{fieldErrors.fullName[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input id="email" name="email" type="email" placeholder="john.doe@ypit.com" required />
        {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input id="phone" name="phone" placeholder="+255..." required />
        {fieldErrors.phone && <p className="text-xs text-red-600">{fieldErrors.phone[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select id="role" name="role" required defaultValue="">
          <option value="" disabled>Select role...</option>
          <option value="MARKETING_STAFF">Marketing Staff</option>
          <option value="SUB_AGENT">Sub Agent</option>
        </Select>
        {fieldErrors.role && <p className="text-xs text-red-600">{fieldErrors.role[0]}</p>}
      </div>

      <div className="space-y-2 pb-4">
        <Label htmlFor="department">Department</Label>
        <Input id="department" name="department" defaultValue="Marketing" />
        {fieldErrors.department && <p className="text-xs text-red-600">{fieldErrors.department[0]}</p>}
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add Employee Lead"}
        </Button>
      </div>
    </form>
  );
}
