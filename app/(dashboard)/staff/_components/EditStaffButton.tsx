'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, KeyRound, Copy, UserMinus, Loader2 } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ActionResult, User } from '@/types';
import {
  updateStaff,
  deactivateStaff,
  resetStaffPassword,
} from '@/lib/actions/staffActions';

interface Props {
  staff: User;
}

export function EditStaffButton({ staff }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Pencil className="w-4 h-4" />
        Edit
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Edit Staff · ${staff.fullName}`}
        description="Update profile, salary, role and account status."
      >
        <EditStaffPanel staff={staff} onClose={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

function EditStaffPanel({ staff, onClose }: { staff: User; onClose: () => void }) {
  return (
    <div className="space-y-6">
      <EditStaffForm staff={staff} onSuccess={onClose} />
      <div className="pt-6 border-t border-gray-100 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Account Tools</p>
        <ResetPasswordRow staffId={staff.id} />
        <DeactivateRow staff={staff} onSuccess={onClose} />
      </div>
    </div>
  );
}

function EditStaffForm({ staff, onSuccess }: { staff: User; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> =>
      updateStaff(staff.id, _prev, formData),
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" defaultValue={staff.fullName} required />
        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={staff.phone ?? ''} />
        {errors.phone && <p className="text-red-500 text-xs">{errors.phone[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue={staff.role}>
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
          <Label htmlFor="department">Department</Label>
          <Input id="department" name="department" defaultValue={staff.department} />
          {errors.department && <p className="text-red-500 text-xs">{errors.department[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={staff.status}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseSalary">Monthly Base Salary (TSh)</Label>
          <Input
            id="baseSalary"
            name="baseSalary"
            type="number"
            min={0}
            step="100"
            defaultValue={staff.baseSalary ?? ''}
            placeholder="e.g. 1500000"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function ResetPasswordRow({ staffId }: { staffId: string }) {
  const [isPending, setPending] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onReset = async () => {
    setPending(true);
    const res = await resetStaffPassword(staffId);
    setPending(false);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    if (res.tempPassword) setTempPassword(res.tempPassword);
  };

  const onCopy = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Unable to copy.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-gray-700">
          <p className="font-semibold flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Reset password
          </p>
          <p className="text-gray-500 mt-0.5">Generates a new temp password and emails it.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} disabled={isPending} className="shrink-0">
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reset'}
        </Button>
      </div>
      {tempPassword && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-amber-900">
            New temp password (shown once)
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-2 py-1.5 bg-white border border-amber-200 rounded font-mono text-xs">
              {tempPassword}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={onCopy}>
              <Copy className="w-3.5 h-3.5 mr-1" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeactivateRow({ staff, onSuccess }: { staff: User; onSuccess: () => void }) {
  const [isPending, setPending] = useState(false);

  const onDeactivate = async () => {
    if (!confirm(`Deactivate ${staff.fullName}? Their account will be soft-deleted and removed from future payroll runs.`)) {
      return;
    }
    setPending(true);
    const res = await deactivateStaff(staff.id);
    setPending(false);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    onSuccess();
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-xs text-gray-700">
        <p className="font-semibold text-red-700 flex items-center gap-1.5">
          <UserMinus className="w-3.5 h-3.5" /> Deactivate account
        </p>
        <p className="text-gray-500 mt-0.5">Soft-deletes the user. Reversible by IT Admin via the DB.</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onDeactivate}
        disabled={isPending}
        className="shrink-0 border-red-200 text-red-700 hover:bg-red-50"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Deactivate'}
      </Button>
    </div>
  );
}
