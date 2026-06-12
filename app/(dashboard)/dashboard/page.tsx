import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import {
  Users,
  Target,
  DollarSign,
  Plane,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { MyQueue } from '@/components/pipeline/MyQueue';
import { Avatar } from '@/components/shared/Avatar';
import { backendFetch } from '@/lib/backend';
import { ReportsOverview, Session, Student } from '@/types';
import { MonthlyIntakeChart, PipelineDonut } from './_components/DashboardCharts';

async function loadOverview(): Promise<ReportsOverview | null> {
  try {
    const res = await backendFetch('/reports/overview');
    if (!res.ok) return null;
    return (await res.json()) as ReportsOverview;
  } catch {
    return null;
  }
}

async function loadRecentStudents(): Promise<Student[]> {
  try {
    const res = await backendFetch('/students?limit=8');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: Student[] };
    return (body.items ?? [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  } catch {
    return [];
  }
}

/** "+3 vs last month" style delta from the last two trend buckets. */
function delta(series: number[]): { trend?: string; direction?: 'up' | 'down' } {
  if (series.length < 2) return {};
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];
  const diff = curr - prev;
  if (diff === 0) return {};
  return { trend: String(Math.abs(diff)), direction: diff > 0 ? 'up' : 'down' };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');

  const session = JSON.parse(sessionCookie.value) as Session;
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const [overview, recentStudents] = await Promise.all([
    loadOverview(),
    loadRecentStudents(),
  ]);

  const m = overview?.keyMetrics;
  const studentDelta = delta(overview?.monthlyTrend.map((t) => t.students) ?? []);
  const leadDelta = delta(overview?.monthlyTrend.map((t) => t.leads) ?? []);
  const travelledDelta = delta(overview?.monthlyTrend.map((t) => t.travelled) ?? []);
  const receiptDelta = delta(overview?.financeTrend.map((t) => t.receipts) ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${session.fullName.split(' ')[0]}`}
        description={today}
      />

      <MyQueue session={session} />

      {!overview && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          Unable to load live metrics from the backend.
        </p>
      )}

      {m && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {session.role === 'FINANCE' ? (
            <>
              <KPICard label="Receipts (YTD)" value={formatCurrency(m.receiptsYtd, { compact: true })} icon={ArrowUpCircle} trend={receiptDelta.trend ? formatCurrency(Number(receiptDelta.trend), { compact: true }) : undefined} trendDirection={receiptDelta.direction} description="vs last month" />
              <KPICard label="Payments (YTD)" value={formatCurrency(m.paymentsYtd, { compact: true })} icon={ArrowDownCircle} />
              <KPICard label="Receivables" value={formatCurrency(m.receivables, { compact: true })} icon={DollarSign} />
              <KPICard label="Total Students" value={String(m.totalStudents)} icon={Users} trend={studentDelta.trend} trendDirection={studentDelta.direction} description="vs last month" />
            </>
          ) : session.role === 'OPERATIONS' ? (
            <>
              <KPICard label="Students Abroad" value={String(m.travelledStudents)} icon={Plane} trend={travelledDelta.trend} trendDirection={travelledDelta.direction} description="vs last month" />
              <KPICard label="Escalations" value={String(m.escalations)} icon={AlertTriangle} />
              <KPICard label="Total Students" value={String(m.totalStudents)} icon={Users} trend={studentDelta.trend} trendDirection={studentDelta.direction} description="vs last month" />
              <KPICard label="Active Leads" value={String(m.activeLeads)} icon={Target} trend={leadDelta.trend} trendDirection={leadDelta.direction} description="vs last month" />
            </>
          ) : (
            <>
              <KPICard label="Total Students" value={String(m.totalStudents)} icon={Users} trend={studentDelta.trend} trendDirection={studentDelta.direction} description="vs last month" />
              <KPICard label="Active Leads" value={String(m.activeLeads)} icon={Target} trend={leadDelta.trend} trendDirection={leadDelta.direction} description="vs last month" />
              <KPICard label="Revenue Collected (YTD)" value={formatCurrency(m.receiptsYtd, { compact: true })} icon={DollarSign} trend={receiptDelta.trend ? formatCurrency(Number(receiptDelta.trend), { compact: true }) : undefined} trendDirection={receiptDelta.direction} description="vs last month" />
              <KPICard label="Students Travelled" value={String(m.travelledStudents)} icon={Plane} trend={travelledDelta.trend} trendDirection={travelledDelta.direction} description="vs last month" />
            </>
          )}
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Monthly Intake (6 months)</h3>
            <MonthlyIntakeChart data={overview.monthlyTrend} />
          </div>
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Pipeline Distribution</h3>
            <PipelineDonut data={overview.pipeline} />
          </div>
        </div>
      )}

      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" /> Recently Registered Students
          </h3>
          <Link href="/students" className="text-xs font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        {recentStudents.length === 0 ? (
          <p className="text-sm text-gray-500 px-5 py-8 text-center">No students yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentStudents.map((s) => (
              <li key={s.id} className="px-5 py-3 flex items-center gap-3">
                <Avatar name={s.fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <Link href={`/students/${s.id}`} className="font-medium text-gray-900 hover:underline truncate block">
                    {s.fullName}
                  </Link>
                  <p className="text-[11px] text-gray-500 truncate">
                    {s.registrationNumber} · {s.targetUniversity || '—'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                    {s.pipelineStage.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(s.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
