'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, CornerDownRight, Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CashBookEntry } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { reconcileManyEntries } from '@/lib/actions/cashbookActions';

export interface RegisterRow extends CashBookEntry {
  /** Unreconciled entry from before this period, carried forward. */
  broughtForward?: boolean;
}

/**
 * The reconciliation register: every bank entry for the period, plus anything
 * still unmatched from earlier months, ticked off against the statement.
 */
export function ReconcileRegister({ rows }: { rows: RegisterRow[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statementRef, setStatementRef] = useState('');

  const unmatched = useMemo(() => rows.filter((r) => !r.reconciled), [rows]);
  const matched = useMemo(() => rows.filter((r) => r.reconciled), [rows]);
  const signed = (r: CashBookEntry) => (r.type === 'RECEIPT' ? r.amount : -r.amount);
  const unmatchedTotal = unmatched.reduce((s, r) => s + signed(r), 0);
  const selectedTotal = rows.filter((r) => selected.has(r.id)).reduce((s, r) => s + signed(r), 0);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const run = (reconciled: boolean) => {
    const ids = rows.filter((r) => selected.has(r.id) && r.reconciled !== reconciled).map((r) => r.id);
    if (ids.length === 0) {
      toast.error(reconciled ? 'Select entries that are still unmatched.' : 'Select reconciled entries to undo.');
      return;
    }
    startTransition(async () => {
      const res = await reconcileManyEntries(ids, reconciled, statementRef.trim() || undefined);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setSelected(new Set());
      router.refresh();
    });
  };

  const allUnmatchedSelected = unmatched.length > 0 && unmatched.every((r) => selected.has(r.id));

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Reconciliation register</h3>
          <p className="text-xs text-gray-500">
            Tick each line that appears on the bank statement. {unmatched.length} unmatched
            {unmatched.length > 0 && <> · {formatCurrency(unmatchedTotal)} net</>}
          </p>
        </div>
        <div className="flex-1" />
        <Input
          value={statementRef}
          onChange={(e) => setStatementRef(e.target.value)}
          placeholder="Statement ref (optional)"
          className="w-48 h-9"
        />
        <Button size="sm" variant="outline" onClick={() => run(false)} disabled={busy || selected.size === 0} className="gap-1.5">
          <Undo2 className="w-3.5 h-3.5" /> Undo
        </Button>
        <Button size="sm" onClick={() => run(true)} disabled={busy || selected.size === 0} className="gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Reconcile {selected.size > 0 ? `(${selected.size})` : ''}
        </Button>
      </div>

      {selected.size > 0 && (
        <p className="px-4 py-2 text-xs bg-primary/5 border-b border-primary/10 text-gray-700">
          {selected.size} selected · net {formatCurrency(selectedTotal)}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="pl-4 py-3 w-8">
                <input
                  type="checkbox"
                  aria-label="Select all unmatched"
                  checked={allUnmatchedSelected}
                  onChange={() => setSelected(allUnmatchedSelected ? new Set() : new Set(unmatched.map((r) => r.id)))}
                />
              </th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Particulars</th>
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium text-right">Receipt</th>
              <th className="px-4 py-3 font-medium text-right">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...unmatched, ...matched].map((e) => (
              <tr
                key={e.id}
                className={`transition-colors ${selected.has(e.id) ? 'bg-primary/5' : e.reconciled ? 'bg-green-50/40' : 'hover:bg-gray-50/60'}`}
              >
                <td className="pl-4 py-2.5">
                  <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} aria-label={`Select ${e.entryNumber}`} />
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                  {formatDate(e.date)}
                  {e.broughtForward && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700" title="Still unmatched from an earlier month">
                      <CornerDownRight className="w-3 h-3" /> b/f
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-gray-900 max-w-[280px] truncate" title={e.description}>{e.description}</p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {e.entryNumber}
                    {e.internal && <span className="ml-1 not-italic text-blue-700">· internal transfer (bank side)</span>}
                  </p>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{e.reference ?? e.bankStatementRef ?? '-'}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-blue-50 text-blue-700">
                    {e.paymentMethod.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-green-700">
                  {e.type === 'RECEIPT' ? formatCurrency(e.amount, { currency: e.currency }) : ''}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-red-600">
                  {e.type === 'PAYMENT' ? formatCurrency(e.amount, { currency: e.currency }) : ''}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${e.reconciled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {e.reconciled ? 'Reconciled' : 'Unmatched'}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  No bank entries for this period, and nothing carried over.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
