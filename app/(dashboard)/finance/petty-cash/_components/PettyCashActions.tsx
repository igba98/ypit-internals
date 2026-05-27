'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AttachmentField } from '@/components/shared/AttachmentField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { recordPettyCashExpense, replenishPettyCash } from '@/lib/actions/pettyCashActions';
import { Wallet, Plus, ArrowDownToLine } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const CATEGORIES = [
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'MEALS', label: 'Meals' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'POSTAGE', label: 'Postage' },
  { value: 'REPAIRS', label: 'Repairs' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'STAFF_WELFARE', label: 'Staff Welfare' },
  { value: 'COURIER', label: 'Courier' },
  { value: 'OTHER', label: 'Other' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export function PettyCashActions({ balance }: { balance: number }) {
  const [openExpense, setOpenExpense] = useState(false);
  const [openReplenish, setOpenReplenish] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setOpenReplenish(true)}
      >
        <ArrowDownToLine className="w-4 h-4" />
        Replenish Float
      </Button>
      <Button
        className="gap-2 bg-primary hover:bg-primary-light text-white"
        onClick={() => setOpenExpense(true)}
      >
        <Plus className="w-4 h-4" />
        New Voucher
      </Button>

      <SlideInPanel
        isOpen={openExpense}
        onClose={() => setOpenExpense(false)}
        title="Record Petty Cash Voucher"
        description={`Current balance: ${formatCurrency(balance)}`}
      >
        <ExpenseForm onSuccess={() => setOpenExpense(false)} />
      </SlideInPanel>

      <SlideInPanel
        isOpen={openReplenish}
        onClose={() => setOpenReplenish(false)}
        title="Replenish Petty Cash"
        description="Top up the float from the bank"
      >
        <ReplenishForm onSuccess={() => setOpenReplenish(false)} />
      </SlideInPanel>
    </div>
  );
}

function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(recordPettyCashExpense, null);
  const fieldErrors = state?.errors ?? {};

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
        <Label htmlFor="date">Date *</Label>
        <Input id="date" name="date" type="date" required defaultValue={todayISO()} />
        {fieldErrors.date && <p className="text-xs text-red-600">{fieldErrors.date[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select id="category" name="category" required defaultValue="">
          <option value="" disabled>Select category...</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        {fieldErrors.category && <p className="text-xs text-red-600">{fieldErrors.category[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input id="description" name="description" placeholder="e.g. Taxi to immigration office" required />
        {fieldErrors.description && <p className="text-xs text-red-600">{fieldErrors.description[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (TSh) *</Label>
          <Input id="amount" name="amount" type="number" min={1} step="100" placeholder="0" required />
          {fieldErrors.amount && <p className="text-xs text-red-600">{fieldErrors.amount[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucherNumber">Voucher #</Label>
          <Input id="voucherNumber" name="voucherNumber" placeholder="auto" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipient">Paid To</Label>
        <Input id="recipient" name="recipient" placeholder="Who received the cash" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Optional details" />
      </div>

      <AttachmentField name="receipt" label="Receipt / proof of payment" />

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          <Wallet className="w-4 h-4 mr-2" />
          {isPending ? 'Recording...' : 'Record Voucher'}
        </Button>
      </div>
    </form>
  );
}

function ReplenishForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(replenishPettyCash, null);
  const fieldErrors = state?.errors ?? {};

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
      <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3">
        <p className="text-xs text-blue-900">
          Replenishments increase the petty cash float. Standard top-up is between TSh 200,000 – 500,000 depending on month-end activity.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date *</Label>
        <Input id="date" name="date" type="date" required defaultValue={todayISO()} />
        {fieldErrors.date && <p className="text-xs text-red-600">{fieldErrors.date[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (TSh) *</Label>
        <Input id="amount" name="amount" type="number" min={1} step="1000" placeholder="300000" required />
        {fieldErrors.amount && <p className="text-xs text-red-600">{fieldErrors.amount[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="voucherNumber">Reference #</Label>
        <Input id="voucherNumber" name="voucherNumber" placeholder="Bank slip / cheque number" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="e.g. Withdrawn from CRDB main account" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          <ArrowDownToLine className="w-4 h-4 mr-2" />
          {isPending ? 'Processing...' : 'Replenish Float'}
        </Button>
      </div>
    </form>
  );
}
