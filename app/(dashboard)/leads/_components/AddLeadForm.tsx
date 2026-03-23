'use client';

import { useActionState, useEffect } from 'react';
import { addLead } from '@/lib/actions/leadActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function AddLeadForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(addLead, null);

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
        <Input id="fullName" name="fullName" placeholder="John Doe" required />
        {state?.errors?.fullName && <p className="text-red-500 text-xs">{state.errors.fullName[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" name="phone" placeholder="+255..." required />
          {state?.errors?.phone && <p className="text-red-500 text-xs">{state.errors.phone[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="john@example.com" />
          {state?.errors?.email && <p className="text-red-500 text-xs">{state.errors.email[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Source *</Label>
        <Select id="source" name="source" required defaultValue="">
          <option value="" disabled>Select a source...</option>
          <option value="SOCIAL_MEDIA">Social Media</option>
          <option value="SCHOOL_VISIT">School Visit</option>
          <option value="SUB_AGENT">Sub Agent</option>
          <option value="REFERRAL">Referral</option>
          <option value="WALK_IN">Walk In</option>
          <option value="WEBSITE">Website</option>
        </Select>
        {state?.errors?.source && <p className="text-red-500 text-xs">{state.errors.source[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label htmlFor="interestedIn">Interested In *</Label>
          <Input id="interestedIn" name="interestedIn" placeholder="e.g. BSc Computer Science" required />
          {state?.errors?.interestedIn && <p className="text-red-500 text-xs">{state.errors.interestedIn[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="interestedCountry">Target Country</Label>
          <Input id="interestedCountry" name="interestedCountry" placeholder="e.g. UK, Australia" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Any initial context or requests..." />
      </div>

      <div className="pt-4 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding Lead..." : "Save Lead"}
        </Button>
      </div>
    </form>
  );
}
