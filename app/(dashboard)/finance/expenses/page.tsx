import { PageHeader } from '@/components/shared/PageHeader';
import { mockExpenses } from '@/lib/mock/mockExpenses';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import {
  Building,
  Zap,
  Wifi,
  ShoppingBag,
  Plane,
  Megaphone,
  Briefcase,
  ShieldCheck,
  Monitor,
  GraduationCap,
  Coins,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { LogExpenseButton, ExpenseStatusCell } from './_components/ExpenseActions';
import { ExpenseCategory } from '@/types';

const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: React.ElementType; iconClass: string }> = {
  RENT: { label: 'Rent', icon: Building, iconClass: 'bg-blue-50 text-blue-700' },
  UTILITIES: { label: 'Utilities', icon: Zap, iconClass: 'bg-amber-50 text-amber-700' },
  INTERNET: { label: 'Internet & Phone', icon: Wifi, iconClass: 'bg-indigo-50 text-indigo-700' },
  OFFICE_SUPPLIES: { label: 'Office Supplies', icon: ShoppingBag, iconClass: 'bg-emerald-50 text-emerald-700' },
  TRAVEL: { label: 'Travel', icon: Plane, iconClass: 'bg-primary-muted text-primary' },
  MARKETING: { label: 'Marketing', icon: Megaphone, iconClass: 'bg-pink-50 text-pink-700' },
  PROFESSIONAL_FEES: { label: 'Professional Fees', icon: Briefcase, iconClass: 'bg-purple-50 text-purple-700' },
  INSURANCE: { label: 'Insurance', icon: ShieldCheck, iconClass: 'bg-teal-50 text-teal-700' },
  EQUIPMENT: { label: 'Equipment', icon: Monitor, iconClass: 'bg-orange-50 text-orange-700' },
  TRAINING: { label: 'Training', icon: GraduationCap, iconClass: 'bg-cyan-50 text-cyan-700' },
  COMMISSIONS: { label: 'Commissions', icon: Coins, iconClass: 'bg-yellow-50 text-yellow-700' },
  OTHER: { label: 'Other', icon: Receipt, iconClass: 'bg-gray-50 text-gray-700' },
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: 'Bank',
  MOBILE_MONEY: 'M-Pesa',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  CARD: 'Card',
  PETTY_CASH: 'Petty Cash',
};

export default async function ExpensesPage() {
  const sorted = [...mockExpenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthExpenses = mockExpenses.filter(e => new Date(e.date) >= monthStart);
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const monthPaid = monthExpenses.filter(e => e.status === 'PAID').reduce((s, e) => s + e.amount, 0);
  const pending = mockExpenses.filter(e => e.status === 'PENDING').reduce((s, e) => s + e.amount, 0);
  const approved = mockExpenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0);

  // Spending by category this month
  const byCategory: Record<string, number> = {};
  for (const e of monthExpenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  }
  const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <>
      <PageHeader
        title="Office Expenses"
        description="Log, approve and track business expenses."
        actions={<LogExpenseButton />}
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile icon={Receipt} label="Spent This Month" value={formatCurrency(monthTotal)} sub={`${monthExpenses.length} expense${monthExpenses.length === 1 ? '' : 's'}`} />
        <KpiTile icon={CheckCircle2} label="Paid" value={formatCurrency(monthPaid)} sub={`${monthExpenses.filter(e => e.status === 'PAID').length} settled`} tone="success" />
        <KpiTile icon={Clock} label="Awaiting Approval" value={formatCurrency(pending)} sub={`${mockExpenses.filter(e => e.status === 'PENDING').length} pending`} tone="warning" />
        <KpiTile icon={AlertCircle} label="Approved · Unpaid" value={formatCurrency(approved)} sub="Ready to pay" tone={approved > 0 ? 'danger' : 'default'} />
      </section>

      {topCats.length > 0 && (
        <section className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Top Categories This Month</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topCats.map(([cat, amount]) => {
              const meta = CATEGORY_META[cat as ExpenseCategory] ?? CATEGORY_META.OTHER;
              const pct = monthTotal > 0 ? Math.round((amount / monthTotal) * 100) : 0;
              const Icon = meta.icon;
              return (
                <div key={cat} className="rounded-lg border border-gray-100 p-4">
                  <div className={`w-9 h-9 rounded-md ${meta.iconClass} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{meta.label}</p>
                  <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(amount)}</p>
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-light" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{pct}% of month</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Expense Register</h3>
          <span className="text-xs text-gray-500">{sorted.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(e => {
                const meta = CATEGORY_META[e.category] ?? CATEGORY_META.OTHER;
                const Icon = meta.icon;
                return (
                  <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900 text-xs">{e.id}</p>
                      <p className="text-[11px] text-gray-500">by {e.recordedByName ?? 'system'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-md flex items-center justify-center ${meta.iconClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-medium text-gray-900">{meta.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 max-w-[260px] truncate" title={e.description}>{e.description}</p>
                      {e.notes && <p className="text-[11px] text-gray-500 mt-0.5 truncate" title={e.notes}>{e.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{e.vendor ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-gray-700 text-xs">
                      {formatDate(e.date)}
                      {e.paidDate && (
                        <p className="text-[11px] text-green-600 mt-0.5">paid {formatDate(e.paidDate)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-50 text-gray-700 border border-gray-100">
                        {PAYMENT_METHOD_LABEL[e.paymentMethod] ?? e.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatCurrency(e.amount, { currency: e.currency })}</td>
                    <td className="px-5 py-3.5"><ExpenseStatusCell expenseId={e.id} value={e.status} /></td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-500">No expenses logged. Click <strong>Log Expense</strong> to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    default: 'bg-gray-50 text-gray-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
  }[tone];
  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1.5 truncate">{value}</p>
          <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${tones} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
