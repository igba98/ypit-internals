import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { MonitoringTable } from './_components/MonitoringTable';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Activity, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { OperationsRecord, Session } from '@/types';
import { backendFetch } from '@/lib/backend';

interface MonitoringListResponse {
  items: OperationsRecord[];
}

async function loadMonitoring(): Promise<{ items: OperationsRecord[]; error: string | null }> {
  try {
    const res = await backendFetch('/monitoring?limit=100');
    if (!res.ok) return { items: [], error: `Failed to load monitoring (HTTP ${res.status})` };
    const body = (await res.json()) as MonitoringListResponse;
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

function inLastDays(date: string | undefined | null, days: number): boolean {
  if (!date) return false;
  const dt = new Date(date).getTime();
  if (Number.isNaN(dt)) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return dt >= cutoff;
}

export default async function MonitoringPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const allowedRoles = ['OPERATIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS'];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');

  const { items: records, error } = await loadMonitoring();

  const studentsAbroad = records.length;
  const checkInsThisWeek = records.filter((o) => inLastDays(o.lastCheckIn, 7)).length;
  const escalations = records.filter((o) => o.escalationFlag).length;
  const enrolledAndSettled = records.filter((o) => o.enrollmentConfirmed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Monitoring"
        description="Monitor student wellbeing and enrollment status abroad."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      {escalations > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Action Required: Escalated Students</h3>
            <p className="text-sm text-red-600 mt-1">
              {escalations} student{escalations === 1 ? '' : 's'} requiring immediate attention.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Students Abroad" value={studentsAbroad} icon={Users} />
        <KPICard label="Check-ins (last 7d)" value={checkInsThisWeek} icon={Activity} />
        <KPICard
          label="Escalations"
          value={escalations}
          icon={AlertTriangle}
          className={escalations > 0 ? 'border-red-200 bg-red-50' : ''}
        />
        <KPICard label="Enrolled & Settled" value={enrolledAndSettled} icon={CheckCircle2} />
      </div>

      <MonitoringTable data={records} />
    </div>
  );
}
