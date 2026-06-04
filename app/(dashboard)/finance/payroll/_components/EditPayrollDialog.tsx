'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Loader2, Save } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { ActionResult, PayrollEntry } from '@/types';
import { updatePayrollEntry } from '@/lib/actions/payrollActions';

interface Props {
  entry: PayrollEntry;
}

export function EditPayrollDialog({ entry }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-light"
        title="Edit base salary, allowances, deductions"
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Edit Payroll · ${entry.staffName}`}
        description={`${entry.period} · DRAFT (PAYE + NSSF will recompute on save)`}
      >
        <EditPayrollForm entry={entry} onSuccess={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

function EditPayrollForm({ entry, onSuccess }: { entry: PayrollEntry; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
      return updatePayrollEntry(entry.id, entry.staffId, formData);
    },
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const [base, setBase] = useState(entry.baseSalary);
  const [allowances, setAllowances] = useState(entry.allowances);
  const [deductions, setDeductions] = useState(entry.deductions);

  // Same formulas as the backend's computePayroll - shown live so finance can sanity-check.
  const paye = Math.max(0, base - 270_000) * 0.09;
  const nssf = base * 0.10;
  const previewNet = Math.max(0, base + allowances - deductions - paye - nssf);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 text-xs text-blue-900">
        Editing is only available while status is DRAFT. PAYE (9% over TSh 270,000) and
        NSSF (10% of base) recompute automatically when you save.
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseSalary">Base Salary (TSh) *</Label>
        <Input
          id="baseSalary"
          name="baseSalary"
          type="number"
          min={0}
          step="100"
          required
          value={base}
          onChange={(e) => setBase(Number(e.target.value) || 0)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="allowances">Allowances (TSh)</Label>
          <Input
            id="allowances"
            name="allowances"
            type="number"
            min={0}
            step="100"
            value={allowances}
            onChange={(e) => setAllowances(Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deductions">Deductions (TSh)</Label>
          <Input
            id="deductions"
            name="deductions"
            type="number"
            min={0}
            step="100"
            value={deductions}
            onChange={(e) => setDeductions(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={entry.notes ?? ''}
          placeholder="Optional - context for this payslip (bonus, leave adjustment, etc.)"
        />
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 space-y-1.5 text-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Live Preview</p>
        <Row label="Base" value={base} />
        <Row label="+ Allowances" value={allowances} />
        <Row label="− Deductions" value={deductions} negative />
        <Row label="− PAYE (9% over 270k)" value={paye} negative />
        <Row label="− NSSF (10%)" value={nssf} negative />
        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-gray-200">
          <span className="font-bold text-gray-900">Estimated Net Pay</span>
          <span className="font-bold text-gray-900">{formatCurrency(previewNet)}</span>
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          name="persistSalary"
          className="mt-0.5 accent-primary"
          defaultChecked
        />
        <span>
          <span className="font-medium">Save as default monthly salary for {entry.staffName}.</span>
          <br />
          <span className="text-gray-500">Future Generate Payroll runs will use this base automatically.</span>
        </span>
      </label>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function Row({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={negative ? 'text-gray-500' : 'text-gray-900 font-medium'}>
        {negative && value > 0 ? '−' : ''}{formatCurrency(value)}
      </span>
    </div>
  );
}
