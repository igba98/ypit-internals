'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createUniversity, updateUniversity } from '@/lib/actions/catalogActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { University, ActionResult } from '@/types';

interface Props {
  mode: 'create' | 'edit';
  university?: University;
  onClose: () => void;
}

export function UniversityForm({ mode, university, onClose }: Props) {
  const router = useRouter();

  const action = async (_prev: unknown, formData: FormData): Promise<ActionResult> => {
    if (mode === 'edit' && university) return updateUniversity(university.id, formData);
    return createUniversity(_prev, formData);
  };

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.message);
      onClose();
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, onClose, router]);

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New University' : `Edit ${university?.name}`}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-2">
          <Field name="name" label="Name *" defaultValue={university?.name} errors={state?.errors?.name} />
          <Field name="country" label="Country *" defaultValue={university?.country} errors={state?.errors?.country} />
          <Field name="city" label="City" defaultValue={university?.city} errors={state?.errors?.city} />
          <Field name="contactName" label="Contact name" defaultValue={university?.contactName} errors={state?.errors?.contactName} />
          <Field name="contactEmail" label="Contact email" type="email" defaultValue={university?.contactEmail} errors={state?.errors?.contactEmail} />
          <Field name="contactPhone" label="Contact phone" defaultValue={university?.contactPhone} errors={state?.errors?.contactPhone} />

          {/* University Management (system updates 3.4) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scope">Local / international</Label>
              <Select id="scope" name="scope" defaultValue={university?.scope ?? 'INTERNATIONAL'}>
                <option value="INTERNATIONAL">International</option>
                <option value="LOCAL">Local (Tanzania)</option>
              </Select>
            </div>
            <Field name="website" label="Website" defaultValue={university?.website ?? undefined} errors={state?.errors?.website} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="programsSummary">Programmes / courses available</Label>
            <Textarea id="programsSummary" name="programsSummary" rows={3} defaultValue={university?.programsSummary ?? ''} placeholder="e.g. BSc Computer Science, MBA, Nursing… (priced packages are managed in the Finance catalog)" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scholarshipNotes">Scholarship opportunities</Label>
            <Textarea id="scholarshipNotes" name="scholarshipNotes" rows={3} defaultValue={university?.scholarshipNotes ?? ''} placeholder="e.g. 50% tuition waiver for GPA ≥ 3.5; full CSC scholarship for master's" />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  name, label, defaultValue, errors, type = 'text',
}: {
  name: string;
  label: string;
  defaultValue?: string;
  errors?: string[];
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ''} />
      {errors && <p className="text-red-500 text-xs">{errors[0]}</p>}
    </div>
  );
}
