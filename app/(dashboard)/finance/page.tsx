import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { MyQueue } from '@/components/pipeline/MyQueue';
import { Session } from '@/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { mockInvoices } from '@/lib/mock/mockInvoices';
import { mockPayroll } from '@/lib/mock/mockPayroll';
import { mockPettyCash, getPettyCashBalance } from '@/lib/mock/mockPettyCash';
import { mockExpenses } from '@/lib/mock/mockExpenses';
import { mockPayments } from '@/lib/mock/mockPayments';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  FileText,
  Users,
  Receipt,
  TrendingUp,
  Banknote,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export default async function FinanceOverviewPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  // --- Aggregates ---
  const pettyCashBalance = getPettyCashBalance();

  const studentBalance = mockPayments.reduce((sum, p) => sum + p.balance, 0);
  const invoicesOutstanding = mockInvoices
    .filter(i => i.status === 'SENT' || i.status === 'PARTIAL' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);
  const receivablesTotal = studentBalance + invoicesOutstanding;

  const expensesPending = mockExpenses
    .filter(e => e.status === 'PENDING' || e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);
  const payrollOutstanding = mockPayroll
    .filter(p => p.status === 'DRAFT' || p.status === 'APPROVED')
    .reduce((sum, p) => sum + p.netPay, 0);
  const payablesTotal = expensesPending + payrollOutstanding;

  // This month metrics
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const revenueThisMonth =
    mockInvoices
      .filter(i => i.paidDate && new Date(i.paidDate) >= monthStart)
      .reduce((sum, i) => sum + i.paidAmount, 0) +
    mockPayments
      .filter(p => p.lastPaymentDate && new Date(p.lastPaymentDate) >= monthStart)
      .reduce((sum, p) => sum + p.totalPaid, 0);
  const expensesThisMonth = mockExpenses
    .filter(e => e.paidDate && new Date(e.paidDate) >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const overdueInvoices = mockInvoices.filter(i => i.status === 'OVERDUE');
  const pendingApprovals = mockExpenses.filter(e => e.status === 'PENDING');
  const draftPayroll = mockPayroll.filter(p => p.status === 'DRAFT');

  // Recent activity
  type ActivityItem = { id: string; kind: string; title: string; amount: number; date: string; href?: string };
  const activity: ActivityItem[] = [
    ...mockInvoices.slice(0, 5).map(i => ({
      id: `act-inv-${i.id}`,
      kind: 'invoice',
      title: `${i.id} → ${i.recipientName}`,
      amount: i.total,
      date: i.createdAt,
      href: '/finance/invoices',
    })),
    ...mockPettyCash.slice(-5).reverse().map(t => ({
      id: `act-pc-${t.id}`,
      kind: 'pettycash',
      title: `${t.voucherNumber ?? t.id} · ${t.description}`,
      amount: t.type === 'EXPENSE' ? -t.amount : t.amount,
      date: t.date,
      href: '/finance/petty-cash',
    })),
    ...mockExpenses.slice(0, 5).map(e => ({
      id: `act-exp-${e.id}`,
      kind: 'expense',
      title: `${e.id} · ${e.description}`,
      amount: -e.amount,
      date: e.createdAt,
      href: '/finance/expenses',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Finance Hub"
        description="Cash position, receivables, payables, payroll and petty cash — all in one place."
      />

      <MyQueue session={session} title="Students Awaiting Payment Confirmation" />

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Receivables"
          value={formatCurrency(receivablesTotal, { compact: true })}
          sublabel={`${formatCurrency(invoicesOutstanding)} on open invoices`}
          icon={ArrowDownCircle}
          tone="success"
        />
        <KpiCard
          label="Payables"
          value={formatCurrency(payablesTotal, { compact: true })}
          sublabel={`${mockExpenses.filter(e => e.status !== 'PAID' && e.status !== 'REJECTED').length} expenses · ${draftPayroll.length} draft payslips`}
          icon={ArrowUpCircle}
          tone="warning"
        />
        <KpiCard
          label="Petty Cash Float"
          value={formatCurrency(pettyCashBalance, { compact: true })}
          sublabel={pettyCashBalance < 100000 ? 'Below safe threshold — replenish soon' : 'Healthy float'}
          icon={Wallet}
          tone={pettyCashBalance < 100000 ? 'danger' : 'primary'}
        />
        <KpiCard
          label="Net This Month"
          value={formatCurrency(revenueThisMonth - expensesThisMonth, { compact: true })}
          sublabel={`+${formatCurrency(revenueThisMonth)} · −${formatCurrency(expensesThisMonth)}`}
          icon={TrendingUp}
          tone="default"
        />
      </div>

      {/* Alerts strip */}
      {(overdueInvoices.length > 0 || pendingApprovals.length > 0 || draftPayroll.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {overdueInvoices.length > 0 && (
            <AlertCard
              tone="danger"
              icon={AlertTriangle}
              title={`${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? '' : 's'}`}
              description={`${formatCurrency(overdueInvoices.reduce((s, i) => s + (i.total - i.paidAmount), 0))} past due`}
              href="/finance/invoices"
            />
          )}
          {pendingApprovals.length > 0 && (
            <AlertCard
              tone="warning"
              icon={Clock}
              title={`${pendingApprovals.length} expense${pendingApprovals.length === 1 ? '' : 's'} awaiting approval`}
              description={`${formatCurrency(pendingApprovals.reduce((s, e) => s + e.amount, 0))} pending`}
              href="/finance/expenses"
            />
          )}
          {draftPayroll.length > 0 && (
            <AlertCard
              tone="info"
              icon={Users}
              title={`${draftPayroll.length} draft payslip${draftPayroll.length === 1 ? '' : 's'}`}
              description={`${formatCurrency(draftPayroll.reduce((s, p) => s + p.netPay, 0))} to process`}
              href="/finance/payroll"
            />
          )}
        </section>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <section className="lg:col-span-1 bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-primary" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <QuickAction icon={FileText} label="Generate Invoice" hint="Issue a new bill to a student or vendor" href="/finance/invoices" />
            <QuickAction icon={Wallet} label="Petty Cash" hint="Log voucher · replenish float" href="/finance/petty-cash" />
            <QuickAction icon={Users} label="Run Payroll" hint="Process this month's payslips" href="/finance/payroll" />
            <QuickAction icon={Receipt} label="Log Expense" hint="Record an office expense" href="/finance/expenses" />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Account Snapshot</h4>
            <dl className="space-y-2.5">
              <Row label="Cash (estimated)" value={formatCurrency(15000000 + pettyCashBalance)} />
              <Row label="Petty cash" value={formatCurrency(pettyCashBalance)} />
              <Row label="Student receivables" value={formatCurrency(studentBalance)} />
              <Row label="Invoice receivables" value={formatCurrency(invoicesOutstanding)} />
              <Row label="Open expenses" value={formatCurrency(expensesPending)} negative />
              <Row label="Draft payroll" value={formatCurrency(payrollOutstanding)} negative />
            </dl>
          </div>
        </section>

        {/* Recent activity feed */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recent Activity
            </h3>
            <span className="text-xs text-gray-500">Last 8 events</span>
          </div>

          <ul className="space-y-2">
            {activity.map(item => {
              const positive = item.amount > 0;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href ?? '#'}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                      item.kind === 'invoice' ? 'bg-blue-50 text-blue-600' :
                      item.kind === 'pettycash' ? 'bg-amber-50 text-amber-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      {item.kind === 'invoice' ? <FileText className="w-4 h-4" /> :
                       item.kind === 'pettycash' ? <Wallet className="w-4 h-4" /> :
                       <Receipt className="w-4 h-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-gray-500">{formatDate(item.date)} · {formatRelativeTime(item.date)}</p>
                    </div>
                    <span className={`text-sm font-bold ${positive ? 'text-green-600' : 'text-gray-700'}`}>
                      {positive ? '+' : ''}{formatCurrency(item.amount)}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                  </Link>
                </li>
              );
            })}
            {activity.length === 0 && (
              <li className="text-center py-12 text-sm text-gray-500">No recent activity.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ElementType;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    default: { iconBg: 'bg-gray-50 text-gray-700', ring: '' },
    primary: { iconBg: 'bg-primary-muted text-primary', ring: '' },
    success: { iconBg: 'bg-green-50 text-green-700', ring: '' },
    warning: { iconBg: 'bg-amber-50 text-amber-700', ring: '' },
    danger: { iconBg: 'bg-red-50 text-red-700', ring: 'ring-1 ring-red-200' },
  }[tone];
  return (
    <div className={`bg-white rounded-xl shadow-card p-5 border border-gray-100 ${tones.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${tones.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 truncate">{sublabel}</p>
    </div>
  );
}

function AlertCard({
  tone,
  icon: Icon,
  title,
  description,
  href,
}: {
  tone: 'danger' | 'warning' | 'info';
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) {
  const tones = {
    danger: 'bg-red-50/60 border-red-200 text-red-900',
    warning: 'bg-amber-50/60 border-amber-200 text-amber-900',
    info: 'bg-blue-50/60 border-blue-200 text-blue-900',
  }[tone];
  const iconTones = {
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-blue-100 text-blue-700',
  }[tone];
  return (
    <Link href={href} className={`rounded-xl border p-4 flex items-start gap-3 hover:shadow-card transition-shadow ${tones}`}>
      <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${iconTones}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs opacity-80 mt-0.5">{description}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 opacity-50 ml-auto shrink-0" />
    </Link>
  );
}

function QuickAction({ icon: Icon, label, hint, href }: { icon: React.ElementType; label: string; hint: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary-muted/40 transition-colors group"
    >
      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shrink-0 shadow-primary-glow">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-[11px] text-gray-500 truncate">{hint}</p>
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary" />
    </Link>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`font-semibold ${negative ? 'text-red-600' : 'text-gray-900'}`}>
        {negative ? '−' : ''}{value}
      </dd>
    </div>
  );
}
