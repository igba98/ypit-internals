import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { backendFetch } from '@/lib/backend';
import { CashBookEntry, CashbookSummary, Session } from '@/types';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  ExternalLink,
  Landmark,
  Scale,
} from 'lucide-react';
import { AddManualEntryButton } from './_components/AddManualEntryButton';

const CASH_METHODS = ['CASH', 'PETTY_CASH'];

/** Plain helper (not a component) so the closure mutation is lint-legal. */
function withRunningBalance(items: CashBookEntry[], opening: number) {
  let running = opening;
  return items.map((e) => {
    running += e.type === 'RECEIPT' ? e.amount : -e.amount;
    return { ...e, runningBalance: running };
  });
}

function monthStartISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadCashbook(from: string, to: string): Promise<{
  items: CashBookEntry[];
  summary: CashbookSummary | null;
  error: string | null;
}> {
  try {
    const qs = `from=${from}&to=${to}`;
    const [listRes, summaryRes] = await Promise.all([
      backendFetch(`/finance/cashbook?${qs}&limit=500`),
      backendFetch(`/finance/cashbook/summary?${qs}`),
    ]);
    if (!listRes.ok) {
      return { items: [], summary: null, error: `Failed to load cash book (HTTP ${listRes.status})` };
    }
    const listBody = (await listRes.json()) as { items: CashBookEntry[] };
    const summary = summaryRes.ok ? ((await summaryRes.json()) as CashbookSummary) : null;
    return { items: listBody.items ?? [], summary, error: null };
  } catch {
    return { items: [], summary: null, error: 'Unable to reach the backend.' };
  }
}

export default async function CashBookPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!['FINANCE', 'MANAGING_DIRECTOR'].includes(session.role)) redirect('/dashboard');

  const params = await searchParams;
  const from = params.from || monthStartISO();
  const to = params.to || todayISO();

  const { items, summary, error } = await loadCashbook(from, to);

  // Running balance starting from the opening balance.
  const rows = withRunningBalance(items, summary?.openingBalance ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Book"
        description="Chronological register of every receipt and payment."
        actions={
          <div className="flex items-center gap-2">
            <AddManualEntryButton />
            <Link
              href={`/print/cashbook?from=${from}&to=${to}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3.5 py-2"
            >
              Generate Report <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Date range filter */}
      <form method="GET" className="bg-white rounded-xl shadow-card border border-gray-100 p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="from" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">From</label>
          <input id="from" name="from" type="date" defaultValue={from} className="block rounded-md border border-gray-200 px-3 py-1.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="to" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">To</label>
          <input id="to" name="to" type="date" defaultValue={to} className="block rounded-md border border-gray-200 px-3 py-1.5 text-sm" />
        </div>
        <button type="submit" className="rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium px-4 py-2">
          Apply
        </button>
      </form>

      {summary && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryTile icon={ArrowUpCircle} label="Receipts" value={formatCurrency(summary.receiptsTotal, { compact: true })} tone="success" sub={`Bank ${formatCurrency(summary.bank.receipts, { compact: true })} · Cash ${formatCurrency(summary.cash.receipts, { compact: true })}`} />
          <SummaryTile icon={ArrowDownCircle} label="Payments" value={formatCurrency(summary.paymentsTotal, { compact: true })} tone="danger" sub={`Bank ${formatCurrency(summary.bank.payments, { compact: true })} · Cash ${formatCurrency(summary.cash.payments, { compact: true })}`} />
          <SummaryTile icon={Scale} label="Net Movement" value={formatCurrency(summary.net, { compact: true })} tone={summary.net >= 0 ? 'success' : 'danger'} sub={`Opening ${formatCurrency(summary.openingBalance, { compact: true })}`} />
          <SummaryTile icon={Landmark} label="Closing Balance" value={formatCurrency(summary.closingBalance, { compact: true })} tone="default" sub={`${summary.unreconciledBankCount} unreconciled bank entr${summary.unreconciledBankCount === 1 ? 'y' : 'ies'}`} />
        </section>
      )}

      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Banknote className="w-4 h-4" /> Cash Book Register
          </h3>
          <span className="text-xs text-gray-500">
            {formatDate(from)} – {formatDate(to)} · {rows.length} entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Entry #</th>
                <th className="px-4 py-3 font-medium">Particulars</th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">Receipt</th>
                <th className="px-4 py-3 font-medium text-right">Payment</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{e.entryNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 max-w-[320px] truncate" title={e.description}>{e.description}</p>
                    <p className="text-[11px] text-gray-500">{e.source.replace(/_/g, ' ').toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{e.reference ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${CASH_METHODS.includes(e.paymentMethod) ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                      {e.paymentMethod.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    {e.type === 'RECEIPT' ? formatCurrency(e.amount, { currency: e.currency }) : ''}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    {e.type === 'PAYMENT' ? formatCurrency(e.amount, { currency: e.currency }) : ''}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {formatCurrency(e.runningBalance)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No entries in this period. Money movements (payments, expenses, payroll, petty cash) appear here automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone: 'default' | 'success' | 'danger';
}) {
  const tones = {
    default: 'bg-gray-50 text-gray-700',
    success: 'bg-green-50 text-green-700',
    danger: 'bg-red-50 text-red-700',
  }[tone];
  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1.5 truncate">{value}</p>
          <p className="text-[11px] text-gray-500 mt-1 truncate">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${tones} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
