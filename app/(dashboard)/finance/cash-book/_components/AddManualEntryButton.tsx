'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { addManualCashBookEntry } from '@/lib/actions/cashbookActions';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function AddManualEntryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 bg-primary hover:bg-primary-light text-white">
        <Plus className="w-4 h-4" />
        Manual Entry
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Manual Cash Book Entry"
        description="Bank charges, interest received, corrections - anything not covered by the automatic feeds."
      >
        <ManualEntryForm onSuccess={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

function ManualEntryForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(addManualCashBookEntry, null);
  const errors = state?.errors ?? {};

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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" required defaultValue={todayISO()} />
          {errors.date && <p className="text-xs text-red-600">{errors.date[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select id="type" name="type" required defaultValue="RECEIPT">
            <option value="RECEIPT">Receipt (money in)</option>
            <option value="PAYMENT">Payment (money out)</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input id="description" name="description" placeholder="e.g. Bank charges for May" required />
        {errors.description && <p className="text-xs text-red-600">{errors.description[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (TSh) *</Label>
          <Input id="amount" name="amount" type="number" min={0} step="100" placeholder="0" required />
          {errors.amount && <p className="text-xs text-red-600">{errors.amount[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Method *</Label>
          <Select id="paymentMethod" name="paymentMethod" required defaultValue="BANK_TRANSFER">
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="PETTY_CASH">Petty Cash</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Reference</Label>
        <Input id="reference" name="reference" placeholder="Statement / slip reference" />
      </div>

      <input type="hidden" name="currency" value="TZS" />

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Add Entry'}
        </Button>
      </div>
    </form>
  );
}
