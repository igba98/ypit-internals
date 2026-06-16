import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { backendFetch } from '@/lib/backend';
import { BankReconciliation, CashBookEntry, CashbookSummary, Session } from '@/types';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, CheckCircle2, History, Landmark, Scale } from 'lucide-react';
import { ReconcileRow } from './_components/ReconcileRow';
import { NewReconciliationForm } from './_components/NewReconciliationForm';

const CASH_METHODS = ['CASH', 'PETTY_CASH'];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function load(day: string): Promise<{
  unreconciled: CashBookEntry[];
  reconciled: CashBookEntry[];
  dayEntries: CashBookEntry[];
  summary: CashbookSummary | null;
  sessions: BankReconciliation[];
  error: string | null;
}> {
  try {
    const [unrecRes, recRes, dayRes, summaryRes, sessionsRes] = await Promise.all([
      backendFetch('/finance/cashbook?column=bank&reconciled=false&limit=200'),
      backendFetch('/finance/cashbook?column=bank&reconciled=true&limit=50'),
      backendFetch(`/finance/cashbook?from=${day}&to=${day}&limit=500`),
      backendFetch('/finance/cashbook/summary'),
      backendFetch('/finance/cashbook/reconciliations'),
    ]);
    if (!unrecRes.ok) {
      return { unreconciled: [], reconciled: [], dayEntries: [], summary: null, sessions: [], error: `Failed to load (HTTP ${unrecRes.status})` };
    }
    const unreconciled = ((await unrecRes.json()) as { items: CashBookEntry[] }).items ?? [];
    const reconciled = recRes.ok ? ((await recRes.json()) as { items: CashBookEntry[] }).items ?? [] : [];
    const dayEntries = dayRes.ok ? ((await dayRes.json()) as { items: CashBookEntry[] }).items ?? [] : [];
    const summary = summaryRes.ok ? ((await summaryRes.json()) as CashbookSummary) : null;
    const sessions = sessionsRes.ok ? ((await sessionsRes.json()) as { items: BankReconciliation[] }).items ?? [] : [];
    return { unreconciled, reconciled, dayEntries, summary, sessions, error: null };
  } catch {
    return { unreconciled: [], reconciled: [], dayEntries: [], summary: null, sessions: [], error: 'Unable to reach the backend.' };
  }
}

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!['FINANCE', 'MANAGING_DIRECTOR'].includes(session.role)) redirect('/dashboard');

  const { day = todayISO() } = await searchParams;
  const { unreconciled, reconciled, dayEntries, summary, sessions, error } = await load(day);

  const bookBankBalance = summary ? summary.bank.net : 0;

  const dayReceipts = dayEntries.filter((e) => e.type === 'RECEIPT');
  const dayPayments = dayEntries.filter((e) => e.type === 'PAYMENT');
  const dayReceiptTotal = dayReceipts.reduce((s, e) => s + e.amount, 0);
  const dayPaymentTotal = dayPayments.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Reconciliation"
        description="Review a day's transactions, tick off entries against the bank statement, then snapshot the reconciliation."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Day view: pick a date, see that day's receipts + payments ── */}
      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" /> Transactions for a Specific Day
          </h3>
          <form method="GET" className="flex items-end gap-2">
            <div className="space-y-1">
              <label htmlFor="day" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Select date</label>
              <input id="day" name="day" type="date" defaultValue={day} className="block rounded-md border border-gray-200 px-3 py-1.5 text-sm" />
            </div>
            <button type="submit" className="rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium px-4 py-1.5">
              View Day
            </button>
          </form>
        </div>

        {/* Day totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-100">
          <div className="bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><ArrowUpCircle className="w-3.5 h-3.5 text-green-600" /> Receipts</p>
            <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(dayReceiptTotal)}</p>
            <p className="text-[11px] text-gray-500">{dayReceipts.length} in</p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><ArrowDownCircle className="w-3.5 h-3.5 text-red-600" /> Payments</p>
            <p className="text-lg font-bold text-red-600 mt-1">{formatCurrency(dayPaymentTotal)}</p>
            <p className="text-[11px] text-gray-500">{dayPayments.length} out</p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Net for {formatDate(day)}</p>
            <p className={`text-lg font-bold mt-1 ${dayReceiptTotal - dayPaymentTotal >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(dayReceiptTotal - dayPaymentTotal)}
            </p>
            <p className="text-[11px] text-gray-500">{dayEntries.length} entries</p>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Entry #</th>
                <th className="px-4 py-3 font-medium">Particulars</th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">Receipt</th>
                <th className="px-4 py-3 font-medium text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dayEntries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{e.entryNumber}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-gray-900 max-w-[280px] truncate" title={e.description}>{e.description}</p>
                    <p className="text-[11px] text-gray-500">{e.source.replace(/_/g, ' ').toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{e.reference ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${CASH_METHODS.includes(e.paymentMethod) ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                      {e.paymentMethod.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-green-700">
                    {e.type === 'RECEIPT' ? formatCurrency(e.amount, { currency: e.currency }) : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-red-600">
                    {e.type === 'PAYMENT' ? formatCurrency(e.amount, { currency: e.currency }) : ''}
                  </td>
                </tr>
              ))}
              {dayEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No transactions on {formatDate(day)}.
                  </td>
                </tr>
              )}
            </tbody>
            {dayEntries.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-bold text-gray-900 bg-gray-50/50">
                  <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wider text-[10px]">Day totals</td>
                  <td className="px-4 py-2.5 text-right text-green-700">{formatCurrency(dayReceiptTotal)}</td>
                  <td className="px-4 py-2.5 text-right text-red-600">{formatCurrency(dayPaymentTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: unreconciled entries */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> Unreconciled Bank Entries
            </h3>
            <span className="text-xs text-gray-500">{unreconciled.length} pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Particulars</th>
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unreconciled.map((e) => (
                  <ReconcileRow key={e.id} entry={e} mode="reconcile" />
                ))}
                {unreconciled.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      <CheckCircle2 className="w-5 h-5 inline-block mr-1.5 text-green-500" />
                      All bank entries are reconciled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {reconciled.length > 0 && (
            <>
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Recently reconciled</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {reconciled.slice(0, 10).map((e) => (
                      <ReconcileRow key={e.id} entry={e} mode="unreconcile" />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Right: statement comparison + history */}
        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-card border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Scale className="w-4 h-4" /> Reconcile Against Statement
            </h3>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Book bank balance</span>
                <span className="font-bold text-gray-900">{formatCurrency(bookBankBalance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Unreconciled entries</span>
                <span className="font-bold text-gray-900">{unreconciled.length}</span>
              </div>
            </div>
            <NewReconciliationForm />
          </section>

          <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <History className="w-4 h-4" /> Past Reconciliations
              </h3>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 px-5 py-8 text-center">None yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sessions.map((r) => (
                  <li key={r.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{r.recNumber}</p>
                        <p className="text-[11px] text-gray-500">
                          Statement {formatDate(r.statementDate)} · by {r.preparedByName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${Math.abs(r.difference) < 1 ? 'text-green-700' : 'text-red-600'}`}>
                          {Math.abs(r.difference) < 1 ? 'Balanced' : `Diff ${formatCurrency(r.difference)}`}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Stmt {formatCurrency(r.statementBalance, { compact: true })} vs book {formatCurrency(r.bookBankBalance, { compact: true })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
