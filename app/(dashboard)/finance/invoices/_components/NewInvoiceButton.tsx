'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createInvoice } from '@/lib/actions/invoiceActions';
import { Plus, FileText } from 'lucide-react';

const todayISO = () => new Date().toISOString().slice(0, 10);
const inDaysISO = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

export function NewInvoiceButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="gap-2 bg-primary hover:bg-primary-light text-white" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        New Invoice
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Generate Invoice"
        description="Issue a bill to a student or vendor"
      >
        <NewInvoiceForm onSuccess={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

function NewInvoiceForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(createInvoice, null);
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
      <div className="space-y-2">
        <Label htmlFor="recipientType">Recipient Type *</Label>
        <Select id="recipientType" name="recipientType" required defaultValue="STUDENT">
          <option value="STUDENT">Student</option>
          <option value="VENDOR">Vendor</option>
          <option value="OTHER">Other</option>
        </Select>
        {errors.recipientType && <p className="text-xs text-red-600">{errors.recipientType[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientName">Recipient Name *</Label>
        <Input id="recipientName" name="recipientName" placeholder="e.g. Ali Hassan or Cloud Office Park" required />
        {errors.recipientName && <p className="text-xs text-red-600">{errors.recipientName[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Invoice Description *</Label>
        <Input id="description" name="description" placeholder="Agency fee for Spring 2026 intake" required />
        {errors.description && <p className="text-xs text-red-600">{errors.description[0]}</p>}
      </div>

      <div className="rounded-lg border border-gray-100 p-3 space-y-3 bg-gray-50/40">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Line Item</p>
        <div className="space-y-2">
          <Label htmlFor="itemDescription">Item Description *</Label>
          <Input id="itemDescription" name="itemDescription" placeholder="Service / item being charged" required />
          {errors.itemDescription && <p className="text-xs text-red-600">{errors.itemDescription[0]}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
            {errors.quantity && <p className="text-xs text-red-600">{errors.quantity[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price (TSh) *</Label>
            <Input id="unitPrice" name="unitPrice" type="number" min={0} step="100" placeholder="0" required />
            {errors.unitPrice && <p className="text-xs text-red-600">{errors.unitPrice[0]}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax">Tax (TSh)</Label>
          <Input id="tax" name="tax" type="number" min={0} step="100" defaultValue={0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue Date *</Label>
          <Input id="issueDate" name="issueDate" type="date" required defaultValue={todayISO()} />
          {errors.issueDate && <p className="text-xs text-red-600">{errors.issueDate[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input id="dueDate" name="dueDate" type="date" required defaultValue={inDaysISO(14)} />
          {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate[0]}</p>}
        </div>
      </div>

      <input type="hidden" name="currency" value="TZS" />

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Internal notes (won't be shown on the invoice)" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          <FileText className="w-4 h-4 mr-2" />
          {isPending ? 'Generating...' : 'Generate Invoice'}
        </Button>
      </div>
    </form>
  );
}
