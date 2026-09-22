'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Lead } from '@/types';
import { convertLeadToStudent } from '@/lib/actions/leadActions';

/** Lead → student. The backend merges these with what the lead already holds. */
export function ConvertLeadForm({ lead, onDone }: { lead: Lead; onDone: () => void }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [f, setF] = useState({
    email: lead.email ?? '',
    nationality: lead.nationality ?? '',
    gender: lead.gender ?? '',
    dateOfBirth: lead.dateOfBirth?.slice(0, 10) ?? '',
    targetUniversity: lead.targetUniversity ?? '',
    targetCountry: lead.interestedCountry ?? '',
    targetProgram: lead.interestedIn ?? '',
    targetIntake: lead.targetIntake ?? '',
    passportNumber: lead.passportNumber ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = () => {
    const missing = (['nationality', 'gender', 'dateOfBirth', 'targetUniversity', 'targetIntake'] as const).filter((k) => !f[k].trim());
    if (missing.length) {
      toast.error(`Still needed: ${missing.join(', ')}`);
      return;
    }
    startTransition(async () => {
      const res = await convertLeadToStudent(lead.id, f);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      onDone();
      if (res.studentId) router.push(`/students/${res.studentId}`);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {!lead.email && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          This lead has no email - add one below or a placeholder will be generated.
        </p>
      )}
      <div className="space-y-2"><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={f.email} onChange={set('email')} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="c-nat">Nationality *</Label><Input id="c-nat" value={f.nationality} onChange={set('nationality')} placeholder="Tanzanian" /></div>
        <div className="space-y-2">
          <Label htmlFor="c-gender">Gender *</Label>
          <Select id="c-gender" value={f.gender} onChange={set('gender')}>
            <option value="">Select…</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div className="space-y-2"><Label htmlFor="c-dob">Date of birth *</Label><Input id="c-dob" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} /></div>
        <div className="space-y-2"><Label htmlFor="c-pass">Passport no.</Label><Input id="c-pass" value={f.passportNumber} onChange={set('passportNumber')} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="c-uni">Target university *</Label><Input id="c-uni" value={f.targetUniversity} onChange={set('targetUniversity')} /></div>
        <div className="space-y-2"><Label htmlFor="c-country">Target country</Label><Input id="c-country" value={f.targetCountry} onChange={set('targetCountry')} /></div>
        <div className="space-y-2"><Label htmlFor="c-prog">Programme</Label><Input id="c-prog" value={f.targetProgram} onChange={set('targetProgram')} /></div>
        <div className="space-y-2"><Label htmlFor="c-intake">Intake *</Label><Input id="c-intake" value={f.targetIntake} onChange={set('targetIntake')} placeholder="September 2027" /></div>
      </div>
      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
          Create student
        </Button>
      </div>
    </div>
  );
}
