import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { PIPELINE_ORDER, PipelineStage, Session, Student } from '@/types';
import { getPipelineStageLabel } from '@/lib/utils';
import { Gauge, AlertTriangle, Clock, Users } from 'lucide-react';

const ALLOWED = ['OPERATIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'];

/** Stages where "days waiting" stops being meaningful — student has arrived. */
const ARRIVED_STAGES: PipelineStage[] = ['TRAVELLED', 'MONITORING'];

const STUCK_DAYS = 14;
const SLOW_DAYS = 7;

function daysSince(iso: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000),
  );
}

async function loadStudents(): Promise<{ items: Student[]; error: string | null }> {
  try {
    const res = await backendFetch('/students?limit=500');
    if (!res.ok)
      return { items: [], error: `Failed to load students (HTTP ${res.status}).` };
    const body = (await res.json()) as { items: Student[] };
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

export default async function PipelineHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!ALLOWED.includes(session.role)) redirect('/dashboard');

  const { stage = 'active' } = await searchParams;
  const { items, error } = await loadStudents();

  const withDays = items.map((s) => ({
    student: s,
    days: daysSince(s.stageEnteredAt ?? s.createdAt),
  }));

  // Active pipeline = not yet travelled. Stuck metrics only count these.
  const active = withDays.filter(
    (e) => !ARRIVED_STAGES.includes(e.student.pipelineStage),
  );
  const stuck = active.filter((e) => e.days > STUCK_DAYS);
  const avgDays =
    active.length > 0
      ? Math.round(active.reduce((s, e) => s + e.days, 0) / active.length)
      : 0;
  const longest = active.reduce((max, e) => Math.max(max, e.days), 0);

  const visible = (
    stage === 'active'
      ? active
      : stage === 'all'
        ? withDays
        : withDays.filter((e) => e.student.pipelineStage === stage)
  ).sort((a, b) => b.days - a.days);

  const tabs = [
    { key: 'active', label: 'Active pipeline' },
    { key: 'all', label: 'All' },
    ...PIPELINE_ORDER.map((s) => ({
      key: s,
      label: getPipelineStageLabel(s),
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline Health"
        description="Where every student sits in the enrollment pipeline — and who has been waiting too long."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="In Pipeline" value={active.length} icon={Users} />
        <KPICard label={`Stuck (> ${STUCK_DAYS} days)`} value={stuck.length} icon={AlertTriangle} />
        <KPICard label="Avg Days in Stage" value={avgDays} icon={Clock} />
        <KPICard label="Longest Waiting (days)" value={longest} icon={Gauge} />
      </div>

      {stuck.length > 0 && stage === 'active' && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {stuck.length} student{stuck.length === 1 ? ' has' : 's have'} been in the
          same stage for more than {STUCK_DAYS} days — follow up with the stage owner.
        </p>
      )}

      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.key === 'active' ? '/pipeline-health' : `/pipeline-health?stage=${t.key}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                stage === t.key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Days in Stage</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Agent / Marketer</th>
                <th className="px-4 py-3 font-medium">Stage Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map(({ student: s, days }) => {
                const arrived = ARRIVED_STAGES.includes(s.pipelineStage);
                const band = arrived
                  ? 'bg-gray-100 text-gray-500'
                  : days > STUCK_DAYS
                    ? 'bg-red-100 text-red-700'
                    : days > SLOW_DAYS
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600';
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      !arrived && days > STUCK_DAYS ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <Link href={`/students/${s.id}`} className="hover:underline">
                        <p className="font-semibold text-gray-900">{s.fullName}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          {s.registrationNumber}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {getPipelineStageLabel(s.pipelineStage)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${band}`}>
                        {days}d
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {s.targetCountry}
                      <p className="text-[11px] text-gray-400">{s.targetUniversity}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {s.assignedAgentName ?? s.marketingStaffName ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {s.stageOwnerName ?? '—'}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No students in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
