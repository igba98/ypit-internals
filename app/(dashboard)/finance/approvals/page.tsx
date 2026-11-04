import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { pageAllowed } from '@/lib/permissions';
import { Session } from '@/types';
import { ShieldCheck, Clock, Ban } from 'lucide-react';
import { listFinanceApprovals } from '@/lib/actions/financeApprovalActions';
import { ApprovalsQueue } from './_components/ApprovalsQueue';

const ALLOWED = ['FINANCE', 'FINANCE_ASSISTANT', 'MANAGING_DIRECTOR'];

const TABS = [
  { key: 'PENDING', label: 'Waiting on Finance' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Held back' },
  { key: 'ALL', label: 'All' },
] as const;

/**
 * Finance approval checkpoints (client request, Nov 2026): Finance approves
 * funds after each section of a student's journey, and confirms the final
 * settlement once everything else is done.
 */
export default async function FinanceApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'finance', ALLOWED)) redirect('/dashboard');

  const { status } = await searchParams;
  const active = TABS.some((t) => t.key === status) ? status! : 'PENDING';

  const [rows, all] = await Promise.all([
    listFinanceApprovals(active === 'ALL' ? undefined : active),
    listFinanceApprovals(),
  ]);

  const counts = {
    pending: (all ?? []).filter((r) => r.status === 'PENDING').length,
    approved: (all ?? []).filter((r) => r.status === 'APPROVED').length,
    rejected: (all ?? []).filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Approvals"
        description="Finance signs off after each section of the journey - the first payment, admission funds, travel clearance, and the final settlement. Each one blocks the stage that follows it."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Waiting on Finance" value={counts.pending} icon={Clock} />
        <KPICard label="Approved" value={counts.approved} icon={ShieldCheck} />
        <KPICard label="Held back" value={counts.rejected} icon={Ban} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/finance/approvals?status=${t.key}`}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              active === t.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {rows === null ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          Unable to load the approval queue.
        </p>
      ) : (
        <ApprovalsQueue rows={rows} />
      )}
    </div>
  );
}
