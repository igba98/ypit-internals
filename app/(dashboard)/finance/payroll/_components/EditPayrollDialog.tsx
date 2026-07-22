'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { AllowanceItem, PayrollEntry } from '@/types';
import { updatePayrollEntry } from '@/lib/actions/payrollActions';

const NSSF_RATE = 0.1;

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
        title="Edit basic salary, allowances, NSSF, PAYE"
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Edit Payroll · ${entry.staffName}`}
        description={`${entry.period} · Basic + allowances = Gross · Gross − NSSF = Taxable · Taxable − PAYE = Net`}
      >
        <EditPayrollForm entry={entry} onSuccess={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

function EditPayrollForm({ entry, onSuccess }: { entry: PayrollEntry; onSuccess: () => void }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  const [base, setBase] = useState(entry.baseSalary);
  const [items, setItems] = useState<AllowanceItem[]>(
    entry.allowanceItems && entry.allowanceItems.length > 0
      ? entry.allowanceItems
      : entry.allowances > 0
        ? [{ name: 'Allowance', amount: entry.allowances }]
        : [],
  );
  // NSSF: auto (10% of gross) until finance touches it, then their number wins.
  const [nssfTouched, setNssfTouched] = useState(false);
  const [nssfManual, setNssfManual] = useState(entry.pension);
  const [paye, setPaye] = useState(entry.tax);
  const [deductions, setDeductions] = useState(entry.deductions);
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [persistSalary, setPersistSalary] = useState(true);

  // ── The client's exact math, live ──
  const allowancesTotal = items.reduce((s, a) => s + (a.amount || 0), 0);
  const gross = base + allowancesTotal;
  const nssf = nssfTouched ? nssfManual : Math.round(gross * NSSF_RATE * 100) / 100;
  const taxable = gross - nssf;
  const netPay = taxable - paye - deductions;

  const setItem = (i: number, patch: Partial<AllowanceItem>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const submit = () => {
    if (base < 0) return toast.error('Basic salary cannot be negative.');
    if (items.some((it) => !it.name.trim())) {
      return toast.error('Give every allowance item a name.');
    }
    startTransition(async () => {
      const res = await updatePayrollEntry(entry.id, entry.staffId, {
        baseSalary: base,
        allowanceItems: items
          .filter((it) => it.name.trim())
          .map((it) => ({ name: it.name.trim(), amount: it.amount || 0 })),
        nssf,
        paye,
        deductions,
        notes: notes.trim() || undefined,
        persistSalary,
      });
      if (res.success) {
        toast.success(res.message);
        onSuccess();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="baseSalary">Basic Salary (TSh) *</Label>
        <Input
          id="baseSalary"
          type="number"
          min={0}
          step="100"
          value={base}
          onChange={(e) => setBase(Number(e.target.value) || 0)}
        />
      </div>

      {/* ── Named allowance items ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Allowances</Label>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { name: '', amount: 0 }])}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-light"
          >
            <Plus className="w-3.5 h-3.5" /> Add item
          </button>
        </div>
        {items.length === 0 && (
          <p className="text-xs text-gray-400">
            No allowances — Gross equals the basic salary.
          </p>
        )}
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="e.g. Transport, Housing, Airtime"
              value={it.name}
              onChange={(e) => setItem(i, { name: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              step="100"
              placeholder="Amount"
              value={it.amount || ''}
              onChange={(e) => setItem(i, { amount: Number(e.target.value) || 0 })}
              className="w-36"
            />
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 shrink-0"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length > 0 && (
          <p className="text-xs text-gray-500 text-right">
            Allowances total: <span className="font-bold text-gray-900">{formatCurrency(allowancesTotal)}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="nssf">NSSF (TSh)</Label>
            {nssfTouched && (
              <button
                type="button"
                onClick={() => setNssfTouched(false)}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                title="Back to automatic 10% of gross"
              >
                <RotateCcw className="w-3 h-3" /> Auto 10%
              </button>
            )}
          </div>
          <Input
            id="nssf"
            type="number"
            min={0}
            step="100"
            value={nssf}
            onChange={(e) => {
              setNssfTouched(true);
              setNssfManual(Number(e.target.value) || 0);
            }}
          />
          <p className="text-[11px] text-gray-500">
            {nssfTouched ? 'Manual value.' : 'Auto: 10% of gross — edit to override.'}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paye">PAYE (TSh)</Label>
          <Input
            id="paye"
            type="number"
            min={0}
            step="100"
            value={paye}
            onChange={(e) => setPaye(Number(e.target.value) || 0)}
          />
          <p className="text-[11px] text-gray-500">Entered by finance — deducted from taxable.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deductions">Other deductions (TSh, optional)</Label>
        <Input
          id="deductions"
          type="number"
          min={0}
          step="100"
          value={deductions}
          onChange={(e) => setDeductions(Number(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional - context for this payslip (bonus, leave adjustment, etc.)"
        />
      </div>

      {/* ── Live breakdown, exactly the client's terminology ── */}
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 space-y-1.5 text-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Payslip Preview</p>
        <Row label="Basic Salary" value={base} />
        <Row label={`+ Allowances (${items.length} item${items.length === 1 ? '' : 's'})`} value={allowancesTotal} />
        <RowStrong label="Gross Salary" value={gross} />
        <Row label="− NSSF" value={nssf} negative />
        <RowStrong label="Taxable Salary" value={taxable} />
        <Row label="− PAYE" value={paye} negative />
        {deductions > 0 && <Row label="− Other deductions" value={deductions} negative />}
        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-gray-200">
          <span className="font-bold text-gray-900">NET PAY</span>
          <span className={`font-bold ${netPay < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(netPay)}
          </span>
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={persistSalary}
          onChange={(e) => setPersistSalary(e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        <span>
          <span className="font-medium">Save as default monthly basic salary for {entry.staffName}.</span>
          <br />
          <span className="text-gray-500">Future Generate Payroll runs will use this basic automatically.</span>
        </span>
      </label>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {busy ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
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

function RowStrong({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-1">
      <span className="font-semibold text-gray-800">{label}</span>
      <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
    </div>
  );
}
