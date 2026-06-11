'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createBankReconciliation } from '@/lib/actions/cashbookActions';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function NewReconciliationForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createBankReconciliation, null);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="statementDate">Statement date *</Label>
        <Input id="statementDate" name="statementDate" type="date" required defaultValue={todayISO()} />
        {errors.statementDate && <p className="text-xs text-red-600">{errors.statementDate[0]}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="statementBalance">Statement closing balance (TSh) *</Label>
        <Input id="statementBalance" name="statementBalance" type="number" step="0.01" placeholder="0" required />
        {errors.statementBalance && <p className="text-xs text-red-600">{errors.statementBalance[0]}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Outstanding cheques, deposits in transit..." />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : 'Save Reconciliation'}
      </Button>
      <p className="text-[11px] text-gray-500">
        Saves a snapshot comparing the statement balance against the book bank
        balance as of the statement date. A zero difference means fully reconciled.
      </p>
    </form>
  );
}
