'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { createBankReconciliation } from '@/lib/actions/cashbookActions';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function NewReconciliationForm({
  bookBankBalance,
  unreconciledCount,
}: {
  bookBankBalance: number;
  unreconciledCount: number;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [statementDate, setStatementDate] = useState(todayISO());
  const [statementRaw, setStatementRaw] = useState('');
  const [notes, setNotes] = useState('');

  const statementBalance = Number(statementRaw);
  const hasStatement = statementRaw.trim() !== '' && Number.isFinite(statementBalance);
  const difference = hasStatement ? statementBalance - bookBankBalance : null;
  const balanced = difference !== null && Math.abs(difference) < 0.005;

  const submit = () => {
    if (!statementDate) return toast.error('Pick the statement date.');
    if (!hasStatement) return toast.error('Enter the statement closing balance.');
    if (!balanced) return toast.error('The difference must be TSh 0 before saving.');

    startTransition(async () => {
      const formData = new FormData();
      formData.set('statementDate', statementDate);
      formData.set('statementBalance', statementRaw);
      if (notes.trim()) formData.set('notes', notes.trim());
      const res = await createBankReconciliation(null, formData);
      if (res.success) {
        toast.success(res.message);
        setStatementRaw('');
        setNotes('');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="statementDate">Statement date *</Label>
        <Input
          id="statementDate"
          type="date"
          value={statementDate}
          onChange={(e) => setStatementDate(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="statementBalance">Statement closing balance (TSh) *</Label>
        <Input
          id="statementBalance"
          type="number"
          step="0.01"
          placeholder="0"
          value={statementRaw}
          onChange={(e) => setStatementRaw(e.target.value)}
        />
      </div>

      {/* Live difference — the save gate. */}
      <div
        className={`rounded-lg border p-3 text-xs flex items-center justify-between ${
          !hasStatement
            ? 'border-gray-100 bg-gray-50 text-gray-500'
            : balanced
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
        }`}
      >
        <span className="font-medium">Difference (statement − book)</span>
        <span className="font-bold">
          {hasStatement ? formatCurrency(difference ?? 0) : '—'}
        </span>
      </div>

      {hasStatement && !balanced && (
        <p className="text-[11px] text-red-600">
          The statement and the book don&apos;t agree yet
          {unreconciledCount > 0
            ? ` — ${unreconciledCount} bank entr${unreconciledCount === 1 ? 'y is' : 'ies are'} still unreconciled above.`
            : ' — check for missing or duplicate bank entries.'}{' '}
          Saving is enabled only when the difference is TSh 0.
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={2}
          placeholder="Outstanding cheques, deposits in transit..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button onClick={submit} disabled={busy || !balanced} className="w-full">
        {busy ? 'Saving...' : 'Save Reconciliation'}
      </Button>
      <p className="text-[11px] text-gray-500">
        Enabled only when Difference = 0. Saves a snapshot comparing the
        statement balance against the book bank balance.
      </p>
    </div>
  );
}
