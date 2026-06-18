'use client';

import { useActionState, useEffect } from 'react';
import { recordPayment } from '@/lib/actions/paymentActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AttachmentField } from '@/components/shared/AttachmentField';
import { toast } from 'sonner';

export interface StudentOption {
  id: string;
  fullName: string;
  registrationNumber: string;
  pipelineStage: string;
}

export function RecordPaymentForm({
  students,
  onSuccess,
}: {
  students: StudentOption[];
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(recordPayment, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const awaiting = students.filter((s) => s.pipelineStage === 'PAYMENT_PENDING');
  const others = students.filter((s) => s.pipelineStage !== 'PAYMENT_PENDING');

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Select Student *</Label>
        <Select id="studentId" name="studentId" required defaultValue="">
          <option value="" disabled>Choose a tracked student...</option>
          {awaiting.length > 0 && (
            <optgroup label="Awaiting payment">
              {awaiting.map(student => (
                <option key={student.id} value={student.id}>{student.fullName} ({student.registrationNumber})</option>
              ))}
            </optgroup>
          )}
          {others.length > 0 && (
            <optgroup label="Other students">
              {others.map(student => (
                <option key={student.id} value={student.id}>{student.fullName} ({student.registrationNumber})</option>
              ))}
            </optgroup>
          )}
        </Select>
        {state?.errors?.studentId && <p className="text-red-500 text-xs">{state.errors.studentId[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label htmlFor="bucket">Fee Type *</Label>
          <Select id="bucket" name="bucket" required defaultValue="AGENCY">
            <option value="AGENCY">Agency Fee</option>
            <option value="APPLICATION">Application Fee</option>
            <option value="TUITION">Tuition Fee</option>
            <option value="HOSTEL">Hostel Fee</option>
          </Select>
          {state?.errors?.bucket && <p className="text-red-500 text-xs">{state.errors.bucket[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (TSh) *</Label>
          <Input id="amount" name="amount" type="number" placeholder="500000" min="1000" required />
          {state?.errors?.amount && <p className="text-red-500 text-xs">{state.errors.amount[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="receiptNumber">Receipt Number *</Label>
          <Input id="receiptNumber" name="receiptNumber" placeholder="RCP-XXXX" required />
          {state?.errors?.receiptNumber && <p className="text-red-500 text-xs">{state.errors.receiptNumber[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentDate">Payment Date *</Label>
          <Input id="paymentDate" name="paymentDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          {state?.errors?.paymentDate && <p className="text-red-500 text-xs">{state.errors.paymentDate[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Transaction Notes</Label>
        <Textarea id="notes" name="notes" placeholder="e.g. Cleared via Bank Transfer" />
      </div>

      <AttachmentField name="receipt" label="Receipt / proof of payment" />

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Processing..." : "Submit Payment"}
        </Button>
      </div>
    </form>
  );
}
