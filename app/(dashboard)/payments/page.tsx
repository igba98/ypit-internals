import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { PaymentsTable } from './_components/PaymentsTable';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { RecordPaymentButton } from './_components/RecordPaymentButton';
import { formatCurrency } from '@/lib/format';
import { PaymentRecord } from '@/types';
import { backendFetch } from '@/lib/backend';

interface PaymentsListResponse {
  items: PaymentRecord[];
}

async function loadPayments(): Promise<{ items: PaymentRecord[]; error: string | null }> {
  try {
    const res = await backendFetch('/finance/payments?limit=500');
    if (!res.ok) return { items: [], error: `Failed to load payments (HTTP ${res.status})` };
    const body = (await res.json()) as PaymentsListResponse;
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

export default async function PaymentsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value);

  const allowedRoles = ['FINANCE', 'MANAGING_DIRECTOR'];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');

  const { items: payments, error } = await loadPayments();

  const totalCollected = payments.reduce((sum, p) => sum + p.totalPaid, 0);
  const pendingCount = payments.filter((p) => p.status === 'PENDING' || p.status === 'PARTIAL').length;
  const overdueCount = payments.filter((p) => p.status === 'OVERDUE').length;
  const clearedCount = payments.filter((p) => p.status === 'CLEARED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Finance"
        description="Manage student payments, agency fees, and tuition."
        actions={
          ['FINANCE', 'MANAGING_DIRECTOR'].includes(session.role) && (
            <RecordPaymentButton />
          )
        }
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Collected" value={formatCurrency(totalCollected, { compact: true })} icon={DollarSign} />
        <KPICard label="Pending Payments" value={pendingCount} icon={Clock} />
        <KPICard label="Overdue" value={overdueCount} icon={AlertCircle} trendDirection="down" />
        <KPICard label="Fully Cleared" value={clearedCount} icon={CheckCircle2} />
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <PaymentsTable data={payments} />
      </div>
    </div>
  );
}
