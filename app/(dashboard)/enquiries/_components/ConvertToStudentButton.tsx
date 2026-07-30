'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GraduationCap, Loader2 } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { WebsiteEnquiry } from '@/types';
import { convertEnquiryToStudent } from '@/lib/actions/enquiryActions';

/** Pull a usable string out of the enquiry's free-form `extra` payload. */
function fromExtra(extra: Record<string, unknown> | null | undefined, key: string): string {
  const v = extra?.[key];
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0].trim();
  return '';
}

function guessGender(raw: string): string {
  const g = raw.trim().toUpperCase();
  return g === 'MALE' || g === 'FEMALE' || g === 'OTHER' ? g : '';
}

export function ConvertToStudentButton({ enquiry }: { enquiry: WebsiteEnquiry }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, startTransition] = useTransition();

  const extra = enquiry.extra ?? null;
  const [nationality, setNationality] = useState(fromExtra(extra, 'nationality'));
  const [gender, setGender] = useState(guessGender(fromExtra(extra, 'gender')));
  const [dateOfBirth, setDateOfBirth] = useState(fromExtra(extra, 'dob').slice(0, 10));
  const [targetProgram, setTargetProgram] = useState(fromExtra(extra, 'preferredField'));
  const [targetCountry, setTargetCountry] = useState(
    fromExtra(extra, 'countries') || enquiry.interestedCountry || '',
  );
  const [targetUniversity, setTargetUniversity] = useState(fromExtra(extra, 'universities'));
  const [targetIntake, setTargetIntake] = useState(fromExtra(extra, 'intake'));
  const [passportNumber, setPassportNumber] = useState(
    fromExtra(extra, 'idType').toLowerCase() === 'passport' ? fromExtra(extra, 'idNumber') : '',
  );

  const submit = () => {
    if (nationality.trim().length < 2) return toast.error('Enter the nationality.');
    if (!gender) return toast.error('Pick the gender.');
    if (!dateOfBirth) return toast.error('Enter the date of birth.');
    if (targetUniversity.trim().length < 2) return toast.error('Enter the target university.');
    if (targetCountry.trim().length < 2) return toast.error('Enter the target country.');
    if (targetProgram.trim().length < 2) return toast.error('Enter the target program.');
    if (targetIntake.trim().length < 2) return toast.error('Enter the target intake (e.g. Sep 2026).');

    startTransition(async () => {
      const res = await convertEnquiryToStudent(enquiry.id, {
        nationality: nationality.trim(),
        gender,
        dateOfBirth,
        targetUniversity: targetUniversity.trim(),
        targetCountry: targetCountry.trim(),
        targetProgram: targetProgram.trim(),
        targetIntake: targetIntake.trim(),
        passportNumber: passportNumber.trim() || undefined,
      });
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1"
        title="Create the student directly — details prefilled from the application"
      >
        <GraduationCap className="w-3.5 h-3.5" /> To Student
      </Button>

      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Convert to Student · ${enquiry.fullName}`}
        description="Prefilled from the website application — confirm or complete, then convert. The student starts at Counseling."
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs space-y-1">
            <p><span className="text-gray-500">Name:</span> <b>{enquiry.fullName}</b></p>
            <p><span className="text-gray-500">Email:</span> {enquiry.email}</p>
            <p><span className="text-gray-500">Phone:</span> {enquiry.phone ?? '—'}</p>
            <p className="text-[11px] text-gray-400">These come from the enquiry and are used as-is.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cs-nationality">Nationality *</Label>
              <Input id="cs-nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Tanzanian" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-gender">Gender *</Label>
              <Select id="cs-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cs-dob">Date of Birth *</Label>
              <Input id="cs-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-passport">Passport Number</Label>
              <Input id="cs-passport" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cs-program">Target Program *</Label>
              <Input id="cs-program" value={targetProgram} onChange={(e) => setTargetProgram(e.target.value)} placeholder="e.g. BSc Medicine" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-country">Target Country *</Label>
              <Input id="cs-country" value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)} placeholder="e.g. India" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cs-university">Target University *</Label>
              <Input id="cs-university" value={targetUniversity} onChange={(e) => setTargetUniversity(e.target.value)} placeholder="e.g. Parul University" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-intake">Target Intake *</Label>
              <Input id="cs-intake" value={targetIntake} onChange={(e) => setTargetIntake(e.target.value)} placeholder="e.g. Sep 2026" />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
              Create Student
            </Button>
          </div>
        </div>
      </SlideInPanel>
    </>
  );
}
