import { backendFetch } from '@/lib/backend';
import { CashBookEntry, CashbookSummary } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { AGENCY_INFO } from '@/lib/agency-info';
import { PrintButton } from '../invoice/[id]/_components/PrintButton';

export const metadata = {
  title: 'Cash Book Report · YPIT',
};

/** Plain helper (not a component) so the closure mutation is lint-legal. */
function withRunningBalance(items: CashBookEntry[], opening: number) {
  let running = opening;
  return items.map((e) => {
    running += e.type === 'RECEIPT' ? e.amount : -e.amount;
    return { ...e, runningBalance: running };
  });
}

async function load(from: string, to: string): Promise<{
  items: CashBookEntry[];
  summary: CashbookSummary | null;
}> {
  try {
    const qs = `from=${from}&to=${to}`;
    const [listRes, summaryRes] = await Promise.all([
      backendFetch(`/finance/cashbook?${qs}&limit=500`),
      backendFetch(`/finance/cashbook/summary?${qs}`),
    ]);
    const items = listRes.ok ? ((await listRes.json()) as { items: CashBookEntry[] }).items ?? [] : [];
    const summary = summaryRes.ok ? ((await summaryRes.json()) as CashbookSummary) : null;
    return { items, summary };
  } catch {
    return { items: [], summary: null };
  }
}

export default async function CashbookPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const from = params.from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = params.to || now.toISOString().slice(0, 10);

  const { items, summary } = await load(from, to);

  const rows = withRunningBalance(items, summary?.openingBalance ?? 0);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[980px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Cash Book Report</p>
            <p className="text-sm text-gray-700">{formatDate(from)} – {formatDate(to)}</p>
          </div>
          <PrintButton />
        </div>

        <article className="bg-white shadow-md print:shadow-none border border-gray-200 print:border-0 rounded-lg print:rounded-none p-10 print:p-8">
          <header className="flex items-start justify-between gap-8 pb-5 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{AGENCY_INFO.name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{AGENCY_INFO.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Cash Book</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{formatDate(from)} – {formatDate(to)}</p>
            </div>
          </header>

          {summary && (
            <section className="grid grid-cols-4 gap-4 mt-5 text-xs">
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Opening</p>
                <p className="font-bold text-gray-900 mt-0.5">{formatCurrency(summary.openingBalance)}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Receipts</p>
                <p className="font-bold text-green-700 mt-0.5">{formatCurrency(summary.receiptsTotal)}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Payments</p>
                <p className="font-bold text-red-600 mt-0.5">{formatCurrency(summary.paymentsTotal)}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Closing</p>
                <p className="font-bold text-gray-900 mt-0.5">{formatCurrency(summary.closingBalance)}</p>
              </div>
            </section>
          )}

          <section className="mt-6">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-600 border-y border-gray-200">
                  <th className="text-left px-2 py-2 font-semibold">Date</th>
                  <th className="text-left px-2 py-2 font-semibold">Entry #</th>
                  <th className="text-left px-2 py-2 font-semibold">Particulars</th>
                  <th className="text-left px-2 py-2 font-semibold">Ref</th>
                  <th className="text-left px-2 py-2 font-semibold">Method</th>
                  <th className="text-right px-2 py-2 font-semibold">Receipts</th>
                  <th className="text-right px-2 py-2 font-semibold">Payments</th>
                  <th className="text-right px-2 py-2 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100">
                    <td className="px-2 py-1.5 whitespace-nowrap text-gray-700">{formatDate(e.date)}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-500">{e.entryNumber}</td>
                    <td className="px-2 py-1.5 text-gray-900">{e.description}</td>
                    <td className="px-2 py-1.5 text-gray-600">{e.reference ?? ''}</td>
                    <td className="px-2 py-1.5 text-gray-600">{e.paymentMethod.replace(/_/g, ' ').toLowerCase()}</td>
                    <td className="px-2 py-1.5 text-right text-green-700 font-medium">
                      {e.type === 'RECEIPT' ? formatCurrency(e.amount) : ''}
                    </td>
                    <td className="px-2 py-1.5 text-right text-red-600 font-medium">
                      {e.type === 'PAYMENT' ? formatCurrency(e.amount) : ''}
                    </td>
                    <td className="px-2 py-1.5 text-right font-bold text-gray-900">{formatCurrency(e.runningBalance)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-500">No entries in this period.</td></tr>
                )}
              </tbody>
              {summary && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold text-gray-900">
                    <td colSpan={5} className="px-2 py-2 text-right uppercase tracking-wider text-[10px]">Totals</td>
                    <td className="px-2 py-2 text-right text-green-700">{formatCurrency(summary.receiptsTotal)}</td>
                    <td className="px-2 py-2 text-right text-red-600">{formatCurrency(summary.paymentsTotal)}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(summary.closingBalance)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </section>

          <footer className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
            <span>Generated by {AGENCY_INFO.name} internal system</span>
            <span>Bank: {summary ? formatCurrency(summary.bank.net) : '—'} · Cash: {summary ? formatCurrency(summary.cash.net) : '—'}</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
