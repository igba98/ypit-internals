'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  studentCount: number;
  onClose: () => void;
  onConfirm: (applyTo: 'NEW_ONLY' | 'NEW_AND_UNPAID') => void;
  pending?: boolean;
}

export function PackageEditConfirmDialog({ open, studentCount, onClose, onConfirm, pending }: Props) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply package changes to existing students?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2 text-sm text-gray-700">
          <p>
            <strong>{studentCount}</strong> student{studentCount === 1 ? ' uses' : 's use'} this
            package. How should the change be applied?
          </p>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={pending}
              onClick={() => onConfirm('NEW_ONLY')}
            >
              Apply to new enrollments only <span className="ml-1 text-gray-400">(recommended)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={pending}
              onClick={() => onConfirm('NEW_AND_UNPAID')}
            >
              Also update unpaid fee lines on existing students
            </Button>
          </div>
        </div>
        <div className="pt-3 flex items-center justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
