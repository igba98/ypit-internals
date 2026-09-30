import { backendFetch } from '@/lib/backend';
import { PettyCashTransaction } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { PrintButton } from '@/app/print/_components/PrintButton';
import { Letterhead, PrintPage, PrintFooter, SignatureLines } from '@/app/print/_components/Letterhead';

export const metadata = {
  title: 'Petty Cash Report · YPIT',
};

async function load(from: string, to: string): Promise<PettyCashTransaction[]> {
  try {
    const res = await backendFetch(
      `/finance/petty-cash?dateFrom=${from}&dateTo=${to}&limit=500`,
    );
    if (!res.ok) return [];
    return ((await res.json()) as { items: PettyCashTransaction[] }).items ?? [];
  } catch {
    return [];
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Local dates - toISOString() would slip a day back in East Africa. */
const monthStartISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const isIn = (t: PettyCashTransaction) => t.type !== 'EXPENSE';

/**
 * Petty cash book for a period: every voucher in date order with money in,
 * money out and the running float, plus a breakdown by category.
 */
export default async function PettyCashReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || monthStartISO();
  const to = params.to || todayISO();

  const items = await load(from, to);
  const rows = [...items].sort((a, b) => a.date.localeCompare(b.date));

  const moneyIn = rows.filter(isIn).reduce((n, t) => n + t.amount, 0);
  const moneyOut = rows.filter((t) => !isIn(t)).reduce((n, t) => n + t.amount, 0);
  // The float before this period is whatever the first voucher left, undone.
  const opening = rows.length
    ? rows[0].balanceAfter - (isIn(rows[0]) ? rows[0].amount : -rows[0].amount)
    : 0;
  const closing = rows.length ? rows[rows.length - 1].balanceAfter : opening;

  const byCategory = new Map<string, number>();
  for (const t of rows.filter((x) => !isIn(x))) {
    const key = (t.category ?? 'OTHER').replace(/_/g, ' ').toLowerCase();
    byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount);
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[1000px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Petty Cash Report</p>
            <p className="text-sm text-gray-700">
              {formatDate(from)} – {formatDate(to)} · {rows.length} voucher{rows.length === 1 ? '' : 's'}
            </p>
          </div>
          <PrintButton />
        </div>

        <PrintPage>
          <Letterhead
            documentType="Petty Cash Report"
            reference={`${formatDate(from)} – ${formatDate(to)}`}
          />

          <section className="grid grid-cols-4 gap-4 mt-6">
            <Stat label="Opening float" value={formatCurrency(opening)} />
            <Stat label="Money in" value={formatCurrency(moneyIn)} />
            <Stat label="Money out" value={formatCurrency(moneyOut)} />
            <Stat label="Closing float" value={formatCurrency(closing)} />
          </section>

          {rows.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">
              No petty cash movement in this period.
            </p>
          ) : (
            <>
              <section className="mt-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-600 border-y border-gray-200">
                      <th className="text-left px-2 py-2 font-semibold w-24">Date</th>
                      <th className="text-left px-2 py-2 font-semibold w-24">Voucher</th>
                      <th className="text-left px-2 py-2 font-semibold">Particulars</th>
                      <th className="text-left px-2 py-2 font-semibold">Category</th>
                      <th className="text-right px-2 py-2 font-semibold w-28">In</th>
                      <th className="text-right px-2 py-2 font-semibold w-28">Out</th>
                      <th className="text-right px-2 py-2 font-semibold w-28">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100">
                        <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="px-2 py-2 text-gray-500 text-xs">{t.voucherNumber || t.txNumber || '-'}</td>
                        <td className="px-2 py-2 text-gray-900">
                          {t.description}
                          {t.recipient && <span className="text-xs text-gray-500"> · {t.recipient}</span>}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-600 capitalize">
                          {t.category ? t.category.replace(/_/g, ' ').toLowerCase() : '-'}
                        </td>
                        <td className="px-2 py-2 text-right text-green-700">
                          {isIn(t) ? formatCurrency(t.amount) : ''}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-900">
                          {isIn(t) ? '' : formatCurrency(t.amount)}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-700">{formatCurrency(t.balanceAfter)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-bold text-gray-900">
                      <td className="px-2 py-2" colSpan={4}>Totals</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(moneyIn)}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(moneyOut)}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(closing)}</td>
                    </tr>
                  </tfoot>
                </table>
              </section>

              {categories.length > 0 && (
                <section className="mt-8">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border-y border-gray-200 px-3 py-2">
                    Spending by category
                  </p>
                  <table className="w-full text-sm">
                    <tbody>
                      {categories.map(([name, amount]) => (
                        <tr key={name} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-700 capitalize">{name}</td>
                          <td className="px-3 py-2 text-right text-gray-500 w-20">
                            {moneyOut > 0 ? `${Math.round((amount / moneyOut) * 100)}%` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 w-40">
                            {formatCurrency(amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              <SignatureLines left="Prepared by (Cashier)" right="Checked by (Finance)" />
            </>
          )}

          <PrintFooter />
        </PrintPage>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-base font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
