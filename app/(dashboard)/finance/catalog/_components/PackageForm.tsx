'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createPackage, updatePackage } from '@/lib/actions/catalogActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, StudyLevel, ActionResult } from '@/types';
import { FeeDefaultsEditor } from './FeeDefaultsEditor';
import { PackageEditConfirmDialog } from './PackageEditConfirmDialog';

const STUDY_LEVELS: StudyLevel[] = ['FOUNDATION', 'BACHELOR', 'MASTERS', 'PHD', 'DIPLOMA'];

interface Props {
  mode: 'create' | 'edit';
  universityId: string;
  pkg?: Package;
  studentCount?: number;
  onClose: () => void;
}

export function PackageForm({ mode, universityId, pkg, studentCount = 0, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>();

  const handleResult = (result: ActionResult) => {
    if (result.success) {
      toast.success(result.message);
      onClose();
      router.refresh();
    } else {
      toast.error(result.message);
      setErrors(result.errors);
    }
  };

  const runUpdate = (formData: FormData, applyTo: 'NEW_ONLY' | 'NEW_AND_UNPAID') => {
    if (!pkg) return;
    startTransition(async () => {
      const result = await updatePackage(pkg.id, formData, applyTo);
      handleResult(result);
    });
    setConfirmOpen(false);
  };

  const submit = (formData: FormData) => {
    formData.set('universityId', universityId);
    if (mode === 'create') {
      startTransition(async () => {
        const result: ActionResult = await createPackage(null, formData);
        handleResult(result);
      });
      return;
    }
    if (studentCount > 0) {
      setPendingFormData(formData);
      setConfirmOpen(true);
    } else {
      runUpdate(formData, 'NEW_ONLY');
    }
  };

  return (
    <>
      <Dialog open onOpenChange={o => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New Package' : `Edit ${pkg?.name}`}</DialogTitle>
          </DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" defaultValue={pkg?.name} placeholder="Bachelor — Business Management" />
              {errors?.name && <p className="text-red-500 text-xs">{errors.name[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="studyLevel">Level *</Label>
                <Select id="studyLevel" name="studyLevel" defaultValue={pkg?.studyLevel ?? 'BACHELOR'}>
                  {STUDY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="program">Program *</Label>
                <Input id="program" name="program" defaultValue={pkg?.program} placeholder="Business Management" />
                {errors?.program && <p className="text-red-500 text-xs">{errors.program[0]}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={pkg?.description} placeholder="Optional notes shown in the catalog." />
            </div>

            <FeeDefaultsEditor initial={pkg?.feeDefaults} name="feeDefaults" />
            {errors?.feeDefaults && <p className="text-red-500 text-xs">{errors.feeDefaults[0]}</p>}

            <div className="pt-3 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PackageEditConfirmDialog
        open={confirmOpen}
        studentCount={studentCount}
        onClose={() => setConfirmOpen(false)}
        onConfirm={applyTo => pendingFormData && runUpdate(pendingFormData, applyTo)}
        pending={pending}
      />
    </>
  );
}
