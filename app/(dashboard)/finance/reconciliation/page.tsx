import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { backendFetch } from '@/lib/backend';
import { pageAllowed } from '@/lib/permissions';
import { BankReconciliation, CashBookEntry, CashbookSummary, Session } from '@/types';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  History,
  Info,
  Landmark,
  Scale,
} from 'lucide-react';
import { NewReconciliationForm } from './_components/NewReconciliationForm';
import { ReconcileRegister, RegisterRow } from './_components/ReconcileRegister';

/** Month boundaries, computed outside the component so render stays pure. */
function monthRange(offset = 0): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: iso(start), to: iso(end) };
}

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function periodLabel(from: string, to: string): string {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const firstOfMonth = a.getDate() === 1;
  const lastOfMonth = new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate() === b.getDate();
  if (sameMonth && firstOfMonth && lastOfMonth) {
    return a.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  return `${formatDate(from)} - ${formatDate(to)}`;
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await backendFetch(path);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'finance', ['FINANCE', 'MANAGING_DIRECTOR'])) redirect('/dashboard');

  const params = await searchParams;
  const thisMonth = monthRange(0);
  const from = params.from ?? thisMonth.from;
  const to = params.to ?? thisMonth.to;
  const label = periodLabel(from, to);
  const lastMonth = monthRange(-1);

  // Everything the register needs: this period's bank entries, whatever is
  // still unmatched from before it, the cash rows we deliberately exclude,
  // the book balance AS AT the period end, and past snapshots.
  const [periodRes, carryRes, cashRes, asAt, periodSummary, sessionsRes] = await Promise.all([
    getJson<{ items: CashBookEntry[] }>(`/finance/cashbook?column=bank&from=${from}&to=${to}&limit=500`, { items: [] }),
    getJson<{ items: CashBookEntry[] }>(`/finance/cashbook?column=bank&reconciled=false&to=${dayBefore(from)}&limit=500`, { items: [] }),
    getJson<{ items: CashBookEntry[] }>(`/finance/cashbook?column=cash&from=${from}&to=${to}&limit=200`, { items: [] }),
    getJson<CashbookSummary | null>(`/finance/cashbook/summary?to=${to}`, null),
    getJson<CashbookSummary | null>(`/finance/cashbook/summary?from=${from}&to=${to}`, null),
    getJson<{ items: BankReconciliation[] }>('/finance/cashbook/reconciliations', { items: [] }),
  ]);

  const carried: RegisterRow[] = carryRes.items.map((e) => ({ ...e, broughtForward: true }));
  const rows: RegisterRow[] = [...carried, ...periodRes.items];
  const excluded = cashRes.items;

  // Balance the bank statement is compared against: the book's bank position
  // at the end of the period (not today's), so a past month can be closed.
  const bookBankBalance = asAt?.bank.net ?? 0;
  const unreconciledCount = rows.filter((r) => !r.reconciled).length;
  const receipts = periodSummary?.bank.receipts ?? 0;
  const payments = periodSummary?.bank.payments ?? 0;
  const sessions = sessionsRes.items;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Reconciliation"
        description="Compare the bank column of the cash book against the bank statement for a period, tick off what matches, then snapshot the result."
      />

      {/* ── Period picker ── */}
      <section className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="from" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">From</label>
            <input id="from" name="from" type="date" defaultValue={from} className="block rounded-md border border-gray-200 px-3 py-1.5 text-sm" />
          </div>
          <div className="space-y-1">
            <label htmlFor="to" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">To</label>
            <input id="to" name="to" type="date" defaultValue={to} className="block rounded-md border border-gray-200 px-3 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium px-4 py-1.5">
            View
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Quick:</span>
            <Link href={`/finance/reconciliation?from=${thisMonth.from}&to=${thisMonth.to}`} className="px-2.5 py-1 rounded-md border border-gray-200 hover:border-primary text-gray-600">This month</Link>
            <Link href={`/finance/reconciliation?from=${lastMonth.from}&to=${lastMonth.to}`} className="px-2.5 py-1 rounded-md border border-gray-200 hover:border-primary text-gray-600">Last month</Link>
          </div>
          <div className="flex-1" />
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Showing <b className="text-gray-900">{label}</b>
          </p>
        </form>
      </section>

      {/* ── Period totals + the balance the statement is checked against ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><ArrowUpCircle className="w-3.5 h-3.5 text-green-600" /> Bank receipts</p>
          <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(receipts)}</p>
          <p className="text-[11px] text-gray-500">{periodRes.items.filter((e) => e.type === 'RECEIPT').length} in · {label}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><ArrowDownCircle className="w-3.5 h-3.5 text-red-600" /> Bank payments</p>
          <p className="text-lg font-bold text-red-600 mt-1">{formatCurrency(payments)}</p>
          <p className="text-[11px] text-gray-500">{periodRes.items.filter((e) => e.type === 'PAYMENT').length} out · {label}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Movement</p>
          <p className={`text-lg font-bold mt-1 ${receipts - payments >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatCurrency(receipts - payments)}</p>
          <p className="text-[11px] text-gray-500">{periodRes.items.length} bank entries</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><Landmark className="w-3.5 h-3.5" /> Book balance at {formatDate(to)}</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(bookBankBalance)}</p>
          <p className="text-[11px] text-gray-500">{unreconciledCount} still unmatched</p>
        </div>
      </div>

      {carried.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          {carried.length} entr{carried.length === 1 ? 'y' : 'ies'} from before {formatDate(from)} {carried.length === 1 ? 'is' : 'are'} still unmatched and {carried.length === 1 ? 'has' : 'have'} been carried into this period (marked <b>b/f</b>).
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ReconcileRegister rows={rows} />

          {excluded.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
              <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-2">
                <Info className="w-3.5 h-3.5" /> Not part of bank reconciliation ({excluded.length})
              </p>
              <ul className="space-y-1">
                {excluded.slice(0, 8).map((e) => (
                  <li key={e.id} className="text-xs text-blue-800">
                    • {formatCurrency(e.amount)} - {e.description}{' '}
                    <span className="uppercase text-[10px] font-bold">({e.paymentMethod.replace(/_/g, ' ')})</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-blue-700 mt-2">
                Cash and petty-cash movements stay in their own ledgers. A petty-cash top-up shows here as the
                petty-cash side only - its bank side is the single bank payment in the register above.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-card border border-gray-100 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Close off {label}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Enter the closing balance from the statement. It is compared against the book balance at{' '}
                {formatDate(to)}.
              </p>
            </div>
            <NewReconciliationForm
              bookBankBalance={bookBankBalance}
              unreconciledCount={unreconciledCount}
              statementDateDefault={to}
            />
          </section>

          <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <History className="w-4 h-4" /> Past reconciliations
              </h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {sessions.slice(0, 8).map((r) => (
                <li key={r.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{formatDate(r.statementDate)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${Math.abs(r.difference) < 0.005 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {Math.abs(r.difference) < 0.005 ? 'Balanced' : `Diff ${formatCurrency(r.difference)}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono">{r.recNumber}</p>
                  <p className="text-[11px] text-gray-500">
                    Statement {formatCurrency(r.statementBalance)} · book {formatCurrency(r.bookBankBalance)} · by {r.preparedByName}
                  </p>
                </li>
              ))}
              {sessions.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-gray-500">No reconciliation snapshots yet.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
