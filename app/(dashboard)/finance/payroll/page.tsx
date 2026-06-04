import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { Users, Banknote, Calendar, Wallet } from 'lucide-react';
import { PayrollHeaderActions, PayrollRowStatus } from './_components/PayrollActions';
import { EditPayrollDialog } from './_components/EditPayrollDialog';
import { PayrollEntry } from '@/types';
import { backendFetch } from '@/lib/backend';

const monthLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

interface PayrollListResponse {
  items: PayrollEntry[];
}

interface StaffListResponse {
  items: { id: string; status: string }[];
}

async function loadInputs(): Promise<{
  payroll: PayrollEntry[];
  activeStaffIds: string[];
  error: string | null;
}> {
  try {
    const [payrollRes, staffRes] = await Promise.all([
      backendFetch('/finance/payroll?limit=500'),
      backendFetch('/staff?status=ACTIVE&limit=100'),
    ]);
    if (!payrollRes.ok) {
      return { payroll: [], activeStaffIds: [], error: `Failed to load payroll (HTTP ${payrollRes.status})` };
    }
    const payrollBody = (await payrollRes.json()) as PayrollListResponse;
    const staffBody = staffRes.ok ? ((await staffRes.json()) as StaffListResponse) : { items: [] };
    return {
      payroll: payrollBody.items ?? [],
      activeStaffIds: (staffBody.items ?? []).filter((u) => u.status === 'ACTIVE').map((u) => u.id),
      error: null,
    };
  } catch {
    return { payroll: [], activeStaffIds: [], error: 'Unable to reach the backend.' };
  }
}

export default async function PayrollPage() {
  const { payroll, activeStaffIds, error } = await loadInputs();

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const currentPeriod = monthLabel(periodStart);

  const periodEntries = payroll.filter((p) => p.period === currentPeriod);
  const otherEntries = [...payroll].filter((p) => p.period !== currentPeriod);

  otherEntries.sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());

  const staffWithRowThisPeriod = new Set(periodEntries.map((p) => p.staffId));
  const missingStaffCount = activeStaffIds.filter((id) => !staffWithRowThisPeriod.has(id)).length;
  const hasDraft = periodEntries.some((p) => p.status === 'DRAFT');
  const hasApproved = periodEntries.some((p) => p.status === 'APPROVED');

  const currentMonthBudget = periodEntries.reduce((s, p) => s + p.netPay, 0);
  const currentPaidOut = periodEntries.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.netPay, 0);
  const currentPending = currentMonthBudget - currentPaidOut;

  const grouped: Record<string, PayrollEntry[]> = {};
  for (const e of otherEntries) {
    (grouped[e.period] ??= []).push(e);
  }

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Generate, approve and pay staff salaries."
        actions={
          <PayrollHeaderActions
            currentPeriod={currentPeriod}
            currentPeriodStart={periodStart.toISOString()}
            hasDraft={hasDraft}
            hasApproved={hasApproved}
            missingStaffCount={missingStaffCount}
            hasAnyEntries={periodEntries.length > 0}
          />
        }
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <section className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-dark text-white p-6 shadow-primary-glow">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Current Period
            </p>
            <p className="text-3xl font-bold mt-1">{currentPeriod}</p>
            <p className="text-sm text-white/80 mt-1">{periodEntries.length} staff on payroll</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Net Payroll</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(currentMonthBudget, { compact: true })}</p>
            <p className="text-xs text-white/70 mt-1">After tax + NSSF</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Pending Payment</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(currentPending, { compact: true })}</p>
            <p className="text-xs text-white/70 mt-1">{currentPaidOut > 0 ? `${formatCurrency(currentPaidOut)} paid` : 'None paid yet'}</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {currentPeriod} Payroll Run
          </h3>
          <span className="text-xs text-gray-500">{periodEntries.length} entries</span>
        </div>

        {periodEntries.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Banknote className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900">No payroll generated for {currentPeriod}</p>
            <p className="text-xs text-gray-500 mt-1">Click <strong>Generate</strong> above to seed payslips from staff base salaries.</p>
          </div>
        ) : (
          <PayrollTable entries={periodEntries} />
        )}
      </section>

      {Object.keys(grouped).length > 0 && (
        <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Payroll History
            </h3>
          </div>
          {Object.entries(grouped).map(([period, entries]) => {
            const total = entries.reduce((s, p) => s + p.netPay, 0);
            const allPaid = entries.every((e) => e.status === 'PAID');
            return (
              <details key={period} className="border-b border-gray-100 last:border-0 group">
                <summary className="cursor-pointer px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${allPaid ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold text-gray-900">{period}</span>
                    <span className="text-xs text-gray-500">{entries.length} staff</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(total)}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${allPaid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {allPaid ? 'All paid' : 'Open'}
                    </span>
                  </div>
                </summary>
                <PayrollTable entries={entries} />
              </details>
            );
          })}
        </section>
      )}
    </>
  );
}

function PayrollTable({ entries }: { entries: PayrollEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500">
            <th className="px-5 py-3 font-medium">Staff</th>
            <th className="px-5 py-3 font-medium">Department</th>
            <th className="px-5 py-3 font-medium text-right">Base</th>
            <th className="px-5 py-3 font-medium text-right">Allowances</th>
            <th className="px-5 py-3 font-medium text-right">PAYE</th>
            <th className="px-5 py-3 font-medium text-right">NSSF</th>
            <th className="px-5 py-3 font-medium text-right">Net Pay</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium text-right">Edit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3.5">
                <p className="font-medium text-gray-900">{e.staffName}</p>
                <p className="text-[11px] text-gray-500">{e.staffRole.replace(/_/g, ' ')}</p>
              </td>
              <td className="px-5 py-3.5 text-gray-700">{e.department}</td>
              <td className="px-5 py-3.5 text-right text-gray-900">{formatCurrency(e.baseSalary)}</td>
              <td className="px-5 py-3.5 text-right text-gray-700">{formatCurrency(e.allowances)}</td>
              <td className="px-5 py-3.5 text-right text-gray-500">−{formatCurrency(e.tax)}</td>
              <td className="px-5 py-3.5 text-right text-gray-500">−{formatCurrency(e.pension)}</td>
              <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatCurrency(e.netPay)}</td>
              <td className="px-5 py-3.5">
                <div className="flex flex-col items-start gap-1">
                  <PayrollRowStatus payrollId={e.id} value={e.status} />
                  {e.paidDate && (
                    <span className="text-[11px] text-gray-500">paid {formatDate(e.paidDate)}</span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-right">
                {e.status === 'DRAFT' ? (
                  <EditPayrollDialog entry={e} />
                ) : (
                  <span className="text-[11px] text-gray-400" title="Only DRAFT rows can be edited">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
