import { backendFetch } from '@/lib/backend';
import { PayrollEntry } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { PrintButton } from '@/app/print/_components/PrintButton';
import { Letterhead, PrintPage, PrintFooter, SignatureLines } from '@/app/print/_components/Letterhead';
import { PayslipDocument } from './_components/PayslipDocument';

export const metadata = {
  title: 'Payroll Report · YPIT',
};

const monthLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

async function loadPeriod(period: string): Promise<PayrollEntry[]> {
  try {
    const res = await backendFetch(
      `/finance/payroll?period=${encodeURIComponent(period)}&limit=500`,
    );
    if (!res.ok) return [];
    return ((await res.json()) as { items: PayrollEntry[] }).items ?? [];
  } catch {
    return [];
  }
}

/**
 * The whole payroll run for a period: a summary sheet finance can file, then
 * every individual payslip behind it (each on its own page). `slips=0` prints
 * the summary alone.
 */
export default async function PayrollPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; slips?: string }>;
}) {
  const { period: asked, slips } = await searchParams;
  const period = asked || monthLabel(new Date());
  const withSlips = slips !== '0';
  const entries = await loadPeriod(period);

  const sorted = [...entries].sort((a, b) => a.staffName.localeCompare(b.staffName));
  const sum = (pick: (e: PayrollEntry) => number) => sorted.reduce((n, e) => n + pick(e), 0);
  const gross = sum((e) => e.grossSalary || e.baseSalary + e.allowances);
  const totals = {
    basic: sum((e) => e.baseSalary),
    allowances: sum((e) => e.allowances),
    gross,
    pension: sum((e) => e.pension),
    tax: sum((e) => e.tax),
    other: sum((e) => e.deductions),
    net: sum((e) => e.netPay),
  };
  const paid = sorted.filter((e) => e.status === 'PAID');

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[1000px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Payroll Report</p>
            <p className="text-sm text-gray-700">
              {period} · {sorted.length} staff{withSlips ? ' · summary + individual slips' : ' · summary only'}
            </p>
          </div>
          <PrintButton />
        </div>

        <PrintPage className={withSlips && sorted.length > 0 ? 'break-after-page' : ''}>
          <Letterhead documentType="Payroll Summary" reference={period} />

          <section className="grid grid-cols-4 gap-4 mt-6">
            <Stat label="Staff on payroll" value={String(sorted.length)} />
            <Stat label="Gross payroll" value={formatCurrency(totals.gross)} />
            <Stat label="Total deductions" value={formatCurrency(totals.pension + totals.tax + totals.other)} />
            <Stat label="Net payable" value={formatCurrency(totals.net)} />
          </section>

          {sorted.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">
              No payroll entries for {period}.
            </p>
          ) : (
            <section className="mt-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-600 border-y border-gray-200">
                    <th className="text-left px-2 py-2 font-semibold">#</th>
                    <th className="text-left px-2 py-2 font-semibold">Staff</th>
                    <th className="text-left px-2 py-2 font-semibold">Department</th>
                    <th className="text-right px-2 py-2 font-semibold">Basic</th>
                    <th className="text-right px-2 py-2 font-semibold">Allowances</th>
                    <th className="text-right px-2 py-2 font-semibold">Gross</th>
                    <th className="text-right px-2 py-2 font-semibold">NSSF</th>
                    <th className="text-right px-2 py-2 font-semibold">PAYE</th>
                    <th className="text-right px-2 py-2 font-semibold">Net pay</th>
                    <th className="text-left px-2 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((e, i) => (
                    <tr key={e.id} className="border-b border-gray-100">
                      <td className="px-2 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-2 py-2 text-gray-900 font-medium">{e.staffName}</td>
                      <td className="px-2 py-2 text-gray-600">{e.department}</td>
                      <td className="px-2 py-2 text-right text-gray-700">{formatCurrency(e.baseSalary)}</td>
                      <td className="px-2 py-2 text-right text-gray-700">{formatCurrency(e.allowances)}</td>
                      <td className="px-2 py-2 text-right text-gray-900">{formatCurrency(e.grossSalary || e.baseSalary + e.allowances)}</td>
                      <td className="px-2 py-2 text-right text-gray-500">−{formatCurrency(e.pension)}</td>
                      <td className="px-2 py-2 text-right text-gray-500">−{formatCurrency(e.tax)}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-900">{formatCurrency(e.netPay)}</td>
                      <td className="px-2 py-2 text-xs text-gray-600 capitalize">{e.status.toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold text-gray-900">
                    <td className="px-2 py-2" colSpan={3}>Totals</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totals.basic)}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totals.allowances)}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totals.gross)}</td>
                    <td className="px-2 py-2 text-right">−{formatCurrency(totals.pension)}</td>
                    <td className="px-2 py-2 text-right">−{formatCurrency(totals.tax)}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totals.net)}</td>
                    <td className="px-2 py-2" />
                  </tr>
                </tfoot>
              </table>

              <p className="text-xs text-gray-500 mt-4">
                {paid.length} of {sorted.length} paid ({formatCurrency(paid.reduce((n, e) => n + e.netPay, 0))}).
                {totals.other > 0 && ` Other deductions: ${formatCurrency(totals.other)}.`}
                {' '}Printed {formatDate(new Date().toISOString())}.
              </p>

              <SignatureLines left="Prepared by (Finance)" right="Approved by (Managing Director)" />
            </section>
          )}

          <PrintFooter />
        </PrintPage>

        {withSlips && sorted.map((e) => <PayslipDocument key={e.id} entry={e} />)}
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
