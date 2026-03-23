'use client';

import { useActionState, useEffect } from 'react';
import { addStudent } from '@/lib/actions/studentActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function AddStudentForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(addStudent, null);

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
      {/* Personal Information */}
      <h3 className="font-urbanist font-bold text-lg border-b pb-2 mb-4 mt-2">Personal Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
        {state?.errors?.fullName && <p className="text-red-500 text-xs">{state.errors.fullName[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
          {state?.errors?.dateOfBirth && <p className="text-red-500 text-xs">{state.errors.dateOfBirth[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select id="gender" name="gender" required defaultValue="">
            <option value="" disabled>Select gender...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
          {state?.errors?.gender && <p className="text-red-500 text-xs">{state.errors.gender[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality *</Label>
          <Input id="nationality" name="nationality" placeholder="e.g. Tanzanian" required />
          {state?.errors?.nationality && <p className="text-red-500 text-xs">{state.errors.nationality[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="passportNumber">Passport Number</Label>
          <Input id="passportNumber" name="passportNumber" placeholder="Optional" />
        </div>
      </div>

      {/* Contact Info */}
      <h3 className="font-urbanist font-bold text-lg border-b pb-2 mb-4 mt-6">Contact Details</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
          {state?.errors?.email && <p className="text-red-500 text-xs">{state.errors.email[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" name="phone" placeholder="+255..." required />
          {state?.errors?.phone && <p className="text-red-500 text-xs">{state.errors.phone[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
           <Label htmlFor="whatsapp">WhatsApp</Label>
           <Input id="whatsapp" name="whatsapp" placeholder="Same as phone?" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leadSource">Source *</Label>
          <Select id="leadSource" name="leadSource" required defaultValue="">
            <option value="" disabled>Select source...</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="SCHOOL_VISIT">School Visit</option>
            <option value="SUB_AGENT">Sub Agent</option>
            <option value="REFERRAL">Referral</option>
            <option value="WALK_IN">Walk In</option>
            <option value="WEBSITE">Website</option>
          </Select>
        </div>
      </div>

      {/* Academic Targets */}
      <h3 className="font-urbanist font-bold text-lg border-b pb-2 mb-4 mt-6">Academic Plan</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetCountry">Target Country *</Label>
          <Input id="targetCountry" name="targetCountry" placeholder="e.g. Australia" required />
          {state?.errors?.targetCountry && <p className="text-red-500 text-xs">{state.errors.targetCountry[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetUniversity">Target University *</Label>
          <Input id="targetUniversity" name="targetUniversity" placeholder="e.g. Univ of Sydney" required />
          {state?.errors?.targetUniversity && <p className="text-red-500 text-xs">{state.errors.targetUniversity[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetProgram">Target Program *</Label>
          <Input id="targetProgram" name="targetProgram" placeholder="e.g. BSc Medicine" required />
          {state?.errors?.targetProgram && <p className="text-red-500 text-xs">{state.errors.targetProgram[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetIntake">Target Intake *</Label>
          <Input id="targetIntake" name="targetIntake" placeholder="e.g. Sep 2026" required />
          {state?.errors?.targetIntake && <p className="text-red-500 text-xs">{state.errors.targetIntake[0]}</p>}
        </div>
      </div>

      <div className="space-y-2 pb-4 pt-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Any initial context required for counseling." />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Onboarding Student..." : "Add Student"}
        </Button>
      </div>
    </form>
  );
}
