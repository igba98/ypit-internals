import { backendFetch } from '@/lib/backend';
import { Invoice } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { PrintButton } from '@/app/print/_components/PrintButton';
import { Letterhead, PrintPage, PrintFooter, SignatureLines } from '@/app/print/_components/Letterhead';

export const metadata = {
  title: 'Invoice Report · YPIT',
};

async function load(from: string, to: string): Promise<Invoice[]> {
  try {
    const res = await backendFetch(
      `/finance/invoices?issuedAfter=${from}&issuedBefore=${to}&limit=500`,
    );
    if (!res.ok) return [];
    return ((await res.json()) as { items: Invoice[] }).items ?? [];
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

/**
 * All invoices raised in a period with what has been collected against them -
 * the aggregate finance asked for alongside the single invoice print.
 */
export default async function InvoicesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || monthStartISO();
  const to = params.to || todayISO();

  const items = await load(from, to);
  const rows = [...items].sort((a, b) => a.issueDate.localeCompare(b.issueDate));
  const live = rows.filter((i) => i.status !== 'VOID');

  const billed = live.reduce((n, i) => n + i.total, 0);
  const collected = live.reduce((n, i) => n + i.paidAmount, 0);
  const outstanding = billed - collected;
  const overdue = live
    .filter((i) => i.status === 'OVERDUE')
    .reduce((n, i) => n + (i.total - i.paidAmount), 0);

  const byStatus = new Map<string, { count: number; total: number }>();
  for (const i of rows) {
    const cur = byStatus.get(i.status) ?? { count: 0, total: 0 };
    byStatus.set(i.status, { count: cur.count + 1, total: cur.total + i.total });
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[1000px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Invoice Report</p>
            <p className="text-sm text-gray-700">
              {formatDate(from)} – {formatDate(to)} · {rows.length} invoice{rows.length === 1 ? '' : 's'}
            </p>
          </div>
          <PrintButton />
        </div>

        <PrintPage>
          <Letterhead
            documentType="Invoice Report"
            reference={`${formatDate(from)} – ${formatDate(to)}`}
          />

          <section className="grid grid-cols-4 gap-4 mt-6">
            <Stat label="Invoiced" value={formatCurrency(billed)} />
            <Stat label="Collected" value={formatCurrency(collected)} />
            <Stat label="Outstanding" value={formatCurrency(outstanding)} />
            <Stat label="Overdue" value={formatCurrency(overdue)} />
          </section>

          {rows.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">
              No invoices issued in this period.
            </p>
          ) : (
            <>
              <section className="mt-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-600 border-y border-gray-200">
                      <th className="text-left px-2 py-2 font-semibold">Invoice</th>
                      <th className="text-left px-2 py-2 font-semibold">Billed to</th>
                      <th className="text-left px-2 py-2 font-semibold w-24">Issued</th>
                      <th className="text-left px-2 py-2 font-semibold w-24">Due</th>
                      <th className="text-right px-2 py-2 font-semibold w-28">Total</th>
                      <th className="text-right px-2 py-2 font-semibold w-28">Paid</th>
                      <th className="text-right px-2 py-2 font-semibold w-28">Balance</th>
                      <th className="text-left px-2 py-2 font-semibold w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((i) => {
                      const bal = i.total - i.paidAmount;
                      return (
                        <tr key={i.id} className="border-b border-gray-100">
                          <td className="px-2 py-2 text-gray-900 font-medium">{i.invoiceNumber ?? i.id}</td>
                          <td className="px-2 py-2 text-gray-700">
                            {i.recipientName}
                            <span className="text-xs text-gray-400 capitalize"> · {i.recipientType.toLowerCase()}</span>
                          </td>
                          <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{formatDate(i.issueDate)}</td>
                          <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{formatDate(i.dueDate)}</td>
                          <td className="px-2 py-2 text-right text-gray-900">{formatCurrency(i.total, { currency: i.currency })}</td>
                          <td className="px-2 py-2 text-right text-green-700">{formatCurrency(i.paidAmount, { currency: i.currency })}</td>
                          <td className={`px-2 py-2 text-right ${bal > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                            {formatCurrency(bal, { currency: i.currency })}
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-600 capitalize">{i.status.toLowerCase()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-bold text-gray-900">
                      <td className="px-2 py-2" colSpan={4}>Totals (excluding void)</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(billed)}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(collected)}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(outstanding)}</td>
                      <td className="px-2 py-2" />
                    </tr>
                  </tfoot>
                </table>
              </section>

              <section className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border-y border-gray-200 px-3 py-2">
                  By status
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {[...byStatus.entries()].map(([status, v]) => (
                      <tr key={status} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-700 capitalize">{status.toLowerCase()}</td>
                        <td className="px-3 py-2 text-right text-gray-500 w-24">{v.count}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 w-40">{formatCurrency(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <SignatureLines left="Prepared by (Finance)" right="Checked by" />
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
