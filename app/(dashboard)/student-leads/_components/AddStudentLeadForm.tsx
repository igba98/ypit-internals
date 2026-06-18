'use client';

import { useActionState, useEffect } from 'react';
import { createStudentLead } from '@/lib/actions/leadActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

/**
 * The "student form" a sub-agent / marketing staff fills in to capture a
 * prospect as a Lead. Only name, phone, source and program are required — the
 * rest of the student profile is optional but, when provided, pre-fills the
 * Student record on conversion (one-click convert later).
 */
export function AddStudentLeadForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(
    createStudentLead,
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

  const err = (k: string) =>
    state?.errors?.[k] && (
      <p className="text-red-500 text-xs">{state.errors[k][0]}</p>
    );

  return (
    <form action={formAction} className="space-y-4">
      {/* Student / prospect */}
      <h3 className="font-urbanist font-bold text-lg border-b pb-2 mb-4 mt-2">
        Student Details
      </h3>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
        {err('fullName')}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" />
          {err('dateOfBirth')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select id="gender" name="gender" defaultValue="">
            <option value="">Select gender...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input id="nationality" name="nationality" placeholder="e.g. Tanzanian" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passportNumber">Passport Number</Label>
          <Input id="passportNumber" name="passportNumber" placeholder="Optional" />
        </div>
      </div>

      {/* Contact */}
      <h3 className="font-urbanist font-bold text-lg border-b pb-2 mb-4 mt-6">
        Contact Details
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" name="phone" placeholder="+255..." required />
          {err('phone')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" placeholder="Same as phone?" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="jane@example.com" />
          {err('email')}
          <p className="text-[11px] text-gray-400">
            Recommended — needed to convert this lead into a student later.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source *</Label>
          <Select id="source" name="source" required defaultValue="">
            <option value="" disabled>
              Select source...
            </option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="SCHOOL_VISIT">School Visit</option>
            <option value="SUB_AGENT">Sub Agent</option>
            <option value="REFERRAL">Referral</option>
            <option value="WALK_IN">Walk In</option>
            <option value="WEBSITE">Website</option>
          </Select>
          {err('source')}
        </div>
      </div>

      {/* Academic plan */}
      <h3 className="font-urbanist font-bold text-lg border-b pb-2 mb-4 mt-6">
        Academic Plan
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="interestedIn">Program of Interest *</Label>
          <Input id="interestedIn" name="interestedIn" placeholder="e.g. BSc Medicine" required />
          {err('interestedIn')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetUniversity">Target University</Label>
          <Input id="targetUniversity" name="targetUniversity" placeholder="e.g. Univ of Sydney" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="interestedCountry">Target Country</Label>
          <Input id="interestedCountry" name="interestedCountry" placeholder="e.g. Australia" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetIntake">Target Intake</Label>
          <Input id="targetIntake" name="targetIntake" placeholder="e.g. Sep 2026" />
        </div>
      </div>

      <div className="space-y-2 pb-4 pt-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Any initial context for counseling." />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Add Student Lead'}
        </Button>
      </div>
    </form>
  );
}
