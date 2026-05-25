'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusSelect } from '@/components/shared/StatusSelect';
import { EXPENSE_STATUS_OPTIONS } from '@/lib/statusOptions';
import { logExpense, updateExpenseStatus } from '@/lib/actions/expenseActions';
import { Plus, Receipt } from 'lucide-react';

const CATEGORIES = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'INTERNET', label: 'Internet & Phone' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional Fees' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'COMMISSIONS', label: 'Commissions' },
  { value: 'OTHER', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
  { value: 'PETTY_CASH', label: 'Petty Cash' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export function LogExpenseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="gap-2 bg-primary hover:bg-primary-light text-white" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Log Expense
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Log Office Expense"
        description="Submit a new expense for approval"
      >
        <ExpenseForm onSuccess={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(logExpense, null);
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
          <Label htmlFor="category">Category *</Label>
          <Select id="category" name="category" required defaultValue="">
            <option value="" disabled>Select...</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          {errors.category && <p className="text-xs text-red-600">{errors.category[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" required defaultValue={todayISO()} />
          {errors.date && <p className="text-xs text-red-600">{errors.date[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input id="description" name="description" placeholder="e.g. Office rent — March 2026" required />
        {errors.description && <p className="text-xs text-red-600">{errors.description[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor">Vendor</Label>
        <Input id="vendor" name="vendor" placeholder="Who you're paying" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (TSh) *</Label>
          <Input id="amount" name="amount" type="number" min={1} step="100" placeholder="0" required />
          {errors.amount && <p className="text-xs text-red-600">{errors.amount[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <Select id="paymentMethod" name="paymentMethod" required defaultValue="">
            <option value="" disabled>Select...</option>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          {errors.paymentMethod && <p className="text-xs text-red-600">{errors.paymentMethod[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Approval context, links to invoices, etc." />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          <Receipt className="w-4 h-4 mr-2" />
          {isPending ? 'Submitting...' : 'Submit for Approval'}
        </Button>
      </div>
    </form>
  );
}

export function ExpenseStatusCell({ expenseId, value }: { expenseId: string; value: string }) {
  return (
    <StatusSelect
      value={value}
      options={EXPENSE_STATUS_OPTIONS}
      action={next => updateExpenseStatus(expenseId, next)}
      editable
      size="sm"
    />
  );
}
