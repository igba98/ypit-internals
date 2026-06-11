import { Avatar } from '@/components/shared/Avatar';
import { PageHeader } from '@/components/shared/PageHeader';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Mail, Phone, Calendar, Plane, Target, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { backendFetch } from '@/lib/backend';
import { PipelineStage, Session, SubAgentDetail } from '@/types';
import { formatDate } from '@/lib/utils';
import { ContractCard } from '../_components/ContractCard';
import { FollowUpLog } from '../_components/FollowUpLog';

const TRAVELLED_STAGES: PipelineStage[] = ['TRAVELLED', 'MONITORING'];

const STAGE_PILL: Partial<Record<PipelineStage, string>> = {
  LEAD: 'bg-gray-100 text-gray-700',
  COUNSELING: 'bg-blue-50 text-blue-700',
  PAYMENT_PENDING: 'bg-amber-50 text-amber-700',
  PAYMENT_CONFIRMED: 'bg-green-50 text-green-700',
  APPLICATION_SUBMITTED: 'bg-indigo-50 text-indigo-700',
  UNIVERSITY_ACCEPTED: 'bg-emerald-50 text-emerald-700',
  TRAVEL_PLANNING: 'bg-purple-50 text-purple-700',
  TRAVELLED: 'bg-rose-50 text-rose-700',
  MONITORING: 'bg-slate-100 text-slate-700',
};

async function loadSubagent(id: string): Promise<SubAgentDetail | null> {
  try {
    const res = await backendFetch(`/subagents/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as SubAgentDetail;
  } catch {
    return null;
  }
}

export default async function SubagentDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const allowedRoles = ['MARKETING_MANAGER', 'MANAGING_DIRECTOR', 'OPERATIONS'];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');

  const canEdit = ['MANAGING_DIRECTOR', 'OPERATIONS'].includes(session.role);

  const { id } = await params;
  const { view = 'all' } = await searchParams;

  const subagent = await loadSubagent(id);
  if (!subagent) notFound();

  const { stats, contract, students } = subagent;
  const travelledStudents = students.filter((s) => TRAVELLED_STAGES.includes(s.pipelineStage));
  const displayed = view === 'travelled' ? travelledStudents : students;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/subagents" className="text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to Subagents
        </Link>
      </div>

      <PageHeader
        title={`Subagent: ${subagent.fullName}`}
        description="Contract, KPI performance, and attributed students."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Profile */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={subagent.fullName} size="xl" className="w-16 h-16 text-xl" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">{subagent.fullName}</h2>
                <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${subagent.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                `}>
                  {subagent.status}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {subagent.email}
              </div>
              {subagent.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {subagent.phone}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                Joined {formatDate(subagent.createdAt)}
              </div>
            </div>
          </div>

          {/* KPI performance */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> KPI Performance
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.studentsRecruited}</div>
                <div className="text-sm text-gray-500 mt-1">Students entered</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.studentsTravelled}</div>
                <div className="text-sm text-gray-500 mt-1">Travelled</div>
              </div>
            </div>
            {stats.studentTarget > 0 ? (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Target: {stats.studentTarget} students</span>
                  <span className="font-bold text-gray-900">{stats.targetProgressPct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (stats.targetProgressPct ?? 0) >= 100 ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${stats.targetProgressPct ?? 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No KPI target set - add one on the contract.</p>
            )}
          </div>

          <ContractCard
            subAgentId={subagent.id}
            subAgentName={subagent.fullName}
            contract={contract}
            canEdit={canEdit}
          />
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Students */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> Students
              </h3>
              <div className="flex gap-4 text-sm">
                <Link
                  href="?view=all"
                  scroll={false}
                  className={`font-medium ${view === 'all' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  All ({students.length})
                </Link>
                <Link
                  href="?view=travelled"
                  scroll={false}
                  className={`font-medium inline-flex items-center gap-1 ${view === 'travelled' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Plane className="w-3.5 h-3.5" /> Travelled ({travelledStudents.length})
                </Link>
              </div>
            </div>

            {displayed.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                {view === 'travelled' ? 'No travelled students yet.' : 'No students attributed yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      <th className="pb-2.5 font-medium">Student</th>
                      <th className="pb-2.5 font-medium">Destination</th>
                      <th className="pb-2.5 font-medium">Stage</th>
                      <th className="pb-2.5 font-medium">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayed.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3">
                          <Link href={`/students/${s.id}`} className="font-medium text-gray-900 hover:underline">
                            {s.fullName}
                          </Link>
                          <p className="text-[11px] text-gray-500">{s.registrationNumber}</p>
                        </td>
                        <td className="py-3 text-gray-700">
                          {s.targetUniversity ? (
                            <>
                              <p className="text-xs">{s.targetUniversity}</p>
                              <p className="text-[11px] text-gray-500">{s.targetCountry}</p>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STAGE_PILL[s.pipelineStage] ?? 'bg-gray-100 text-gray-700'}`}>
                            {s.pipelineStage.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-gray-500">{formatDate(s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <FollowUpLog
            subAgentId={subagent.id}
            followUps={contract?.followUps ?? []}
            canEdit={canEdit}
          />
        </div>
      </div>
    </div>
  );
}
