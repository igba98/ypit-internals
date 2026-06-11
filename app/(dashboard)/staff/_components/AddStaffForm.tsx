'use client';

import { useActionState, useEffect, useState } from 'react';
import { addStaff } from '@/lib/actions/staffActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { Copy, KeyRound, Mail, MailWarning } from 'lucide-react';

export function AddStaffForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(addStaff, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      // If there's no temp password to show, we're done - close the panel.
      // Otherwise the conditional render below switches to CredentialsCard
      // and `onSuccess` will fire when the admin clicks "Done" there.
      if (!state.tempPassword) onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  if (state?.tempPassword) {
    return (
      <CredentialsCard
        tempPassword={state.tempPassword}
        delivered={state.emailDelivered ?? false}
        onClose={onSuccess}
      />
    );
  }

  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input id="email" name="email" type="email" placeholder="name@ypitconsultancies.com" required />
        {errors.email && <p className="text-red-500 text-xs">{errors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+255 700 000 000" />
        {errors.phone && <p className="text-red-500 text-xs">{errors.phone[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select id="role" name="role" required defaultValue="MARKETING_STAFF">
            <option value="MANAGING_DIRECTOR">Managing Director</option>
            <option value="IT_ADMIN">IT Admin</option>
            <option value="MARKETING_MANAGER">Marketing Manager</option>
            <option value="MARKETING_STAFF">Marketing Staff</option>
            <option value="FINANCE">Finance</option>
            <option value="ADMISSIONS">Admissions</option>
            <option value="TRAVEL">Travel</option>
            <option value="OPERATIONS">Operations</option>
            <option value="SUB_AGENT">Sub Agent</option>
          </Select>
          {errors.role && <p className="text-red-500 text-xs">{errors.role[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input id="department" name="department" placeholder="e.g. Marketing" required />
          {errors.department && <p className="text-red-500 text-xs">{errors.department[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseSalary">Monthly Base Salary (TSh)</Label>
        <Input
          id="baseSalary"
          name="baseSalary"
          type="number"
          min={0}
          step="100"
          placeholder="e.g. 1500000"
        />
        <p className="text-[11px] text-gray-500">
          Used by payroll generation. Leave blank to set later.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 text-xs text-blue-900 flex items-start gap-2">
        <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          A temporary password will be generated and emailed. The new staff member
          must change it on first login.
        </p>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating account...' : 'Create Staff Account'}
        </Button>
      </div>
    </form>
  );
}

function CredentialsCard({
  tempPassword,
  delivered,
  onClose,
}: {
  tempPassword: string;
  delivered: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Unable to copy. Select the password manually.');
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border p-4 flex items-start gap-3 ${
          delivered ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}
      >
        {delivered ? (
          <Mail className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
        ) : (
          <MailWarning className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        )}
        <div className="text-xs">
          <p className="font-semibold text-gray-900">
            {delivered ? 'Welcome email sent.' : 'Email delivery failed.'}
          </p>
          <p className="text-gray-600 mt-0.5">
            {delivered
              ? 'The staff member has been emailed their credentials. The password below is also shown once for your records.'
              : 'Please share the temporary password manually with the new staff member.'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Temporary Password (shown once)</Label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm">
            {tempPassword}
          </code>
          <Button type="button" variant="outline" onClick={onCopy} className="shrink-0">
            <Copy className="w-4 h-4 mr-1.5" />
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="text-[11px] text-gray-500">
          Once you close this dialog the password cannot be recovered. The staff
          member will be required to change it on first login.
        </p>
      </div>

      <div className="pt-4 flex items-center justify-end border-t border-gray-100">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
