'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ActionResult } from '@/types';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Loader2 } from 'lucide-react';
import { generatePreAdmissionNotice } from '@/lib/actions/letterActions';

export interface NoticeStudent {
  id: string;
  fullName: string;
  registrationNumber: string;
  nationality: string;
  passportNumber: string;
  gender: string;
  targetProgram: string;
  phone: string;
  dateOfBirth: string;
  email: string;
}

export function GenerateNoticeButton({
  students,
  hasActiveTemplate,
}: {
  students: NoticeStudent[];
  hasActiveTemplate: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-primary hover:bg-primary-light text-white"
        title={hasActiveTemplate ? undefined : 'Create and activate a template first'}
      >
        <FileText className="w-4 h-4" />
        Generate Notice
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Generate Pre-Admission Notice"
        description="Details prefill from the student record - correct anything before sending. The letter is emailed automatically."
      >
        <NoticeForm
          students={students}
          hasActiveTemplate={hasActiveTemplate}
          onSuccess={() => setOpen(false)}
        />
      </SlideInPanel>
    </>
  );
}

function NoticeForm({
  students,
  hasActiveTemplate,
  onSuccess,
}: {
  students: NoticeStudent[];
  hasActiveTemplate: boolean;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState('');
  const selected = students.find((s) => s.id === selectedId) ?? null;
  const [state, formAction, isPending] = useActionState(generatePreAdmissionNotice, null);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
      if (state.noticeId) {
        window.open(`/print/notice/${state.noticeId}`, '_blank', 'noopener,noreferrer');
      }
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router, onSuccess]);

  const dob = selected?.dateOfBirth ? selected.dateOfBirth.slice(0, 10) : '';

  return (
    <form action={formAction} className="space-y-4">
      {!hasActiveTemplate && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          No template is active yet - generation will fail until one is toggled <strong>In Use</strong>.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="studentId">Student *</Label>
        <Select
          id="studentId"
          name="studentId"
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="" disabled>Choose a student...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.registrationNumber})
            </option>
          ))}
        </Select>
        {errors.studentId && <p className="text-xs text-red-600">{errors.studentId[0]}</p>}
      </div>

      {/* key forces re-mount on student change so defaultValues re-prefill */}
      <div key={selectedId} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" name="fullName" defaultValue={selected?.fullName ?? ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality *</Label>
            <Input id="nationality" name="nationality" defaultValue={selected?.nationality ?? ''} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="passportNo">Passport No</Label>
            <Input id="passportNo" name="passportNo" defaultValue={selected?.passportNumber ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" name="gender" defaultValue={selected?.gender ?? ''}>
              <option value="">-</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="courseInterested">Course Interested *</Label>
          <Input id="courseInterested" name="courseInterested" defaultValue={selected?.targetProgram ?? ''} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input id="contactNumber" name="contactNumber" defaultValue={selected?.phone ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={dob} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fatherName">Father&apos;s Name</Label>
            <Input id="fatherName" name="fatherName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motherName">Mother&apos;s Name</Label>
            <Input id="motherName" name="motherName" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentContact">Parent&apos;s Contact</Label>
          <Input id="parentContact" name="parentContact" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" rows={2} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailTo">Send To (email)</Label>
          <Input
            id="emailTo"
            name="emailTo"
            type="email"
            defaultValue={selected?.email ?? ''}
            placeholder="Defaults to the student's email on record"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending || !selectedId} className="gap-1.5">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Generating & emailing...' : 'Generate & Email'}
        </Button>
      </div>
    </form>
  );
}
