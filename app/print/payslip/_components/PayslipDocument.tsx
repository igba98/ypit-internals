import { PayrollEntry } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { AGENCY_INFO } from '@/lib/agency-info';
import { ROLE_LABELS } from '@/lib/permissions';
import { Letterhead, PrintPage, PrintFooter, SignatureLines } from '@/app/print/_components/Letterhead';

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200 line-through',
};

/**
 * One staff member's salary slip. Earnings on the left, deductions on the
 * right, net pay in words underneath - the layout Tanzanian staff expect to
 * sign for.
 */
export function PayslipDocument({ entry }: { entry: PayrollEntry }) {
  const gross = entry.grossSalary || entry.baseSalary + entry.allowances;
  const taxable = entry.taxableSalary || gross - entry.pension;
  const totalDeductions = entry.pension + entry.tax + entry.deductions;

  return (
    <PrintPage className="break-after-page last:break-after-auto">
      <Letterhead
        documentType="Salary Slip"
        reference={entry.payrollNumber ?? entry.id}
        badge={
          <span
            className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_BADGE[entry.status] ?? STATUS_BADGE.DRAFT}`}
          >
            {entry.status}
          </span>
        }
      />

      <section className="grid grid-cols-2 gap-8 mt-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Employee</p>
          <p className="text-base font-semibold text-gray-900 mt-1">{entry.staffName}</p>
          <p className="text-xs text-gray-500">{ROLE_LABELS[entry.staffRole] ?? entry.staffRole.replace(/_/g, ' ')}</p>
          <p className="text-xs text-gray-500">{entry.department}</p>
        </div>
        <div className="text-right">
          <dl className="text-xs space-y-1">
            <Row label="Pay Period" value={entry.period} />
            <Row label="From" value={formatDate(entry.periodStart)} />
            <Row label="To" value={formatDate(entry.periodEnd)} />
            {entry.paidDate && <Row label="Paid On" value={formatDate(entry.paidDate)} />}
            {entry.paymentMethod && (
              <Row label="Paid By" value={entry.paymentMethod.replace(/_/g, ' ').toLowerCase()} />
            )}
          </dl>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6 mt-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border-y border-gray-200 px-3 py-2">
            Earnings
          </p>
          <table className="w-full text-sm">
            <tbody>
              <Line label="Basic salary" amount={entry.baseSalary} />
              {(entry.allowanceItems ?? []).map((a, i) => (
                <Line key={`${a.name}-${i}`} label={a.name} amount={a.amount} indent />
              ))}
              {(entry.allowanceItems?.length ?? 0) === 0 && entry.allowances > 0 && (
                <Line label="Allowances" amount={entry.allowances} />
              )}
              <tr className="border-t border-gray-300 font-bold text-gray-900">
                <td className="px-3 py-2">Gross pay</td>
                <td className="px-3 py-2 text-right">{formatCurrency(gross)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border-y border-gray-200 px-3 py-2">
            Deductions
          </p>
          <table className="w-full text-sm">
            <tbody>
              <Line label="NSSF (pension)" amount={entry.pension} />
              <Line label="PAYE (tax)" amount={entry.tax} />
              {entry.deductions > 0 && <Line label="Other deductions" amount={entry.deductions} />}
              <tr className="border-t border-gray-300 font-bold text-gray-900">
                <td className="px-3 py-2">Total deductions</td>
                <td className="px-3 py-2 text-right">{formatCurrency(totalDeductions)}</td>
              </tr>
              <tr className="text-xs text-gray-500">
                <td className="px-3 py-2">Taxable pay</td>
                <td className="px-3 py-2 text-right">{formatCurrency(taxable)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Net Pay</p>
          <p className="text-xs text-gray-600 mt-0.5">Gross less NSSF, PAYE and other deductions</p>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(entry.netPay)}</p>
      </section>

      {entry.notes && (
        <section className="mt-6 text-xs text-gray-600">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Notes</p>
          <p className="whitespace-pre-wrap">{entry.notes}</p>
        </section>
      )}

      <SignatureLines left="Prepared by (Finance)" right="Approved by" third="Received by (Employee)" />
      <PrintFooter note={`This payslip is computer generated by ${AGENCY_INFO.name}. Keep it for your records.`} />
    </PrintPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <dt className="text-gray-500">{label}:</dt>
      <dd className="text-gray-900 font-medium w-32 capitalize">{value}</dd>
    </div>
  );
}

function Line({ label, amount, indent }: { label: string; amount: number; indent?: boolean }) {
  return (
    <tr className="border-b border-gray-100">
      <td className={`px-3 py-2 text-gray-700 ${indent ? 'pl-6 text-xs' : ''}`}>{label}</td>
      <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(amount)}</td>
    </tr>
  );
}
