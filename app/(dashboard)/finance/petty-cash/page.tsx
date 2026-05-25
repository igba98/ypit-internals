import { PageHeader } from '@/components/shared/PageHeader';
import { mockPettyCash, getPettyCashBalance } from '@/lib/mock/mockPettyCash';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Tag,
  Calendar,
  ReceiptText,
  AlertTriangle,
} from 'lucide-react';
import { PettyCashActions } from './_components/PettyCashActions';
import { PettyCashTxType, PettyCashCategory } from '@/types';

const CATEGORY_LABEL: Record<PettyCashCategory, string> = {
  OFFICE_SUPPLIES: 'Office Supplies',
  TRANSPORT: 'Transport',
  MEALS: 'Meals',
  UTILITIES: 'Utilities',
  POSTAGE: 'Postage',
  REPAIRS: 'Repairs',
  CLEANING: 'Cleaning',
  STAFF_WELFARE: 'Staff Welfare',
  COURIER: 'Courier',
  OTHER: 'Other',
};

const CATEGORY_PILL: Record<PettyCashCategory, string> = {
  OFFICE_SUPPLIES: 'bg-blue-50 text-blue-700',
  TRANSPORT: 'bg-purple-50 text-purple-700',
  MEALS: 'bg-orange-50 text-orange-700',
  UTILITIES: 'bg-emerald-50 text-emerald-700',
  POSTAGE: 'bg-gray-50 text-gray-700',
  REPAIRS: 'bg-amber-50 text-amber-700',
  CLEANING: 'bg-teal-50 text-teal-700',
  STAFF_WELFARE: 'bg-pink-50 text-pink-700',
  COURIER: 'bg-indigo-50 text-indigo-700',
  OTHER: 'bg-gray-50 text-gray-600',
};

const TYPE_META: Record<PettyCashTxType, { label: string; icon: React.ElementType; iconClass: string }> = {
  EXPENSE: { label: 'Expense', icon: ArrowUpRight, iconClass: 'bg-red-50 text-red-600' },
  REPLENISHMENT: { label: 'Replenishment', icon: ArrowDownLeft, iconClass: 'bg-green-50 text-green-600' },
  INITIAL_FLOAT: { label: 'Initial Float', icon: PiggyBank, iconClass: 'bg-primary-muted text-primary' },
};

export default async function PettyCashPage() {
  const balance = getPettyCashBalance();
  const txs = [...mockPettyCash].reverse(); // newest first

  // This-month aggregations
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthExpenses = mockPettyCash
    .filter(t => t.type === 'EXPENSE' && new Date(t.date) >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthReplenishments = mockPettyCash
    .filter(t => t.type === 'REPLENISHMENT' && new Date(t.date) >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown this month
  const byCategory: Record<string, number> = {};
  for (const t of mockPettyCash) {
    if (t.type !== 'EXPENSE') continue;
    if (new Date(t.date) < monthStart) continue;
    const k = t.category ?? 'OTHER';
    byCategory[k] = (byCategory[k] ?? 0) + t.amount;
  }
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topMax = topCategories[0]?.[1] ?? 0;

  const lowBalance = balance < 100000;

  return (
    <>
      <PageHeader
        title="Petty Cash"
        description="Log office vouchers, track the float, and replenish from the bank."
        actions={<PettyCashActions balance={balance} />}
      />

      {/* Hero balance */}
      <section className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-dark text-white p-6 shadow-primary-glow">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Current Float
            </p>
            <p className="text-4xl md:text-5xl font-bold mt-2">{formatCurrency(balance)}</p>
            {lowBalance ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm bg-red-500/30 border border-red-300/40 px-3 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" /> Below safe threshold — replenish soon
              </p>
            ) : (
              <p className="text-xs text-white/70 mt-2">Healthy float · safe threshold {formatCurrency(100000)}</p>
            )}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Spent This Month</p>
            <p className="text-2xl font-bold mt-1.5">{formatCurrency(monthExpenses)}</p>
            <p className="text-xs text-white/70 mt-1">{mockPettyCash.filter(t => t.type === 'EXPENSE' && new Date(t.date) >= monthStart).length} vouchers</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Replenished</p>
            <p className="text-2xl font-bold mt-1.5">{formatCurrency(monthReplenishments)}</p>
            <p className="text-xs text-white/70 mt-1">{mockPettyCash.filter(t => t.type === 'REPLENISHMENT' && new Date(t.date) >= monthStart).length} top-ups</p>
          </div>
        </div>
      </section>

      {/* Category breakdown */}
      {topCategories.length > 0 && (
        <section className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Spending by Category (This Month)
            </h3>
            <span className="text-xs text-gray-500">Top 5</span>
          </div>
          <div className="space-y-3">
            {topCategories.map(([cat, amount]) => {
              const pct = topMax > 0 ? Math.round((amount / topMax) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_PILL[cat as PettyCashCategory] ?? CATEGORY_PILL.OTHER}`}>
                      {CATEGORY_LABEL[cat as PettyCashCategory] ?? cat}
                    </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                  <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Transaction log */}
      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-primary" />
            Voucher Register
          </h3>
          <span className="text-xs text-gray-500">{txs.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 font-medium">Voucher</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Recipient</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {txs.map(tx => {
                const meta = TYPE_META[tx.type];
                const Icon = meta.icon;
                const isExpense = tx.type === 'EXPENSE';
                return (
                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${meta.iconClass}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{tx.voucherNumber ?? tx.id}</p>
                          <p className="text-[11px] text-gray-500">{meta.label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(tx.date)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 font-medium">{tx.description}</p>
                      {tx.notes && <p className="text-[11px] text-gray-500 mt-0.5">{tx.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      {tx.category ? (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_PILL[tx.category]}`}>
                          {CATEGORY_LABEL[tx.category]}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{tx.recipient ?? <span className="text-gray-300">—</span>}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                      {isExpense ? '−' : '+'}{formatCurrency(tx.amount, { currency: tx.currency })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      {formatCurrency(tx.balanceAfter, { currency: tx.currency })}
                    </td>
                  </tr>
                );
              })}
              {txs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">No petty cash transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
