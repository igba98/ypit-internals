'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CashBookEntry } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Undo2 } from 'lucide-react';
import {
  reconcileCashBookEntry,
  unreconcileCashBookEntry,
} from '@/lib/actions/cashbookActions';

export function ReconcileRow({
  entry,
  mode,
}: {
  entry: CashBookEntry;
  mode: 'reconcile' | 'unreconcile';
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      const res =
        mode === 'reconcile'
          ? await reconcileCashBookEntry(entry.id)
          : await unreconcileCashBookEntry(entry.id);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <tr className={`hover:bg-gray-50/60 transition-colors ${mode === 'unreconcile' ? 'opacity-70' : ''}`}>
      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{formatDate(entry.date)}</td>
      <td className="px-4 py-3">
        <p className="text-gray-900 max-w-[260px] truncate" title={entry.description}>{entry.description}</p>
        <p className="text-[11px] text-gray-500 font-mono">{entry.entryNumber}</p>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">{entry.reference ?? '-'}</td>
      <td className={`px-4 py-3 text-right font-semibold ${entry.type === 'RECEIPT' ? 'text-green-700' : 'text-red-600'}`}>
        {entry.type === 'RECEIPT' ? '+' : '−'}{formatCurrency(entry.amount, { currency: entry.currency })}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          variant={mode === 'reconcile' ? 'outline' : 'ghost'}
          size="sm"
          onClick={onToggle}
          disabled={busy}
          className="gap-1.5"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : mode === 'reconcile' ? (
            <>
              <Check className="w-3.5 h-3.5" /> Reconcile
            </>
          ) : (
            <>
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </>
          )}
        </Button>
      </td>
    </tr>
  );
}
