import { PageHeader } from '@/components/shared/PageHeader';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users, Trophy, AlertCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddLeadButton } from './_components/AddLeadButton';
import { Avatar } from '@/components/shared/Avatar';
import { ADMITTED_STAGES, PipelineStage, Role, Student, User } from '@/types';
import { backendFetch } from '@/lib/backend';

interface LeadStat {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatar?: string;
  studentsApproached: number;
  studentsAdmitted: number;
  conversionRate: number;
}

interface StaffListResponse {
  items: User[];
}

interface StudentsListResponse {
  items: Student[];
}

async function loadData(): Promise<{
  marketers: User[];
  students: Student[];
  error: string | null;
}> {
  try {
    const [staffRes, studentsRes] = await Promise.all([
      backendFetch('/staff?limit=500'),
      backendFetch('/students?limit=500'),
    ]);
    // Students are the critical dataset; staff is only used for the marketer
    // performance table, so a staff failure degrades gracefully.
    if (!studentsRes.ok) {
      return {
        marketers: [],
        students: [],
        error: `Failed to load students (HTTP ${studentsRes.status}).`,
      };
    }
    const staffBody = staffRes.ok
      ? ((await staffRes.json()) as StaffListResponse)
      : { items: [] };
    const studentsBody = (await studentsRes.json()) as StudentsListResponse;
    const marketers = (staffBody.items ?? []).filter(
      (u) => u.role === 'MARKETING_STAFF' || u.role === 'SUB_AGENT',
    );
    return { marketers, students: studentsBody.items ?? [], error: null };
  } catch {
    return { marketers: [], students: [], error: 'Unable to reach the backend.' };
  }
}

export default async function LeadsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value);

  const allowedRoles = [
    'MARKETING_MANAGER',
    'MARKETING_STAFF',
    'SUB_AGENT',
    'MANAGING_DIRECTOR',
    'IT_ADMIN',
  ];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');

  const { marketers, students, error } = await loadData();

  // Sub-agents only see themselves.
  const visibleMarketers =
    session.role === 'SUB_AGENT'
      ? marketers.filter((u) => u.id === session.userId)
      : marketers;

  const leadsStats: LeadStat[] = visibleMarketers.map((emp) => {
    const approached = students.filter((s) => s.assignedAgentId === emp.id);
    const admitted = approached.filter((s) =>
      ADMITTED_STAGES.includes(s.pipelineStage as PipelineStage),
    );
    const conversionRate =
      approached.length > 0
        ? Math.round((admitted.length / approached.length) * 100)
        : 0;
    return {
      id: emp.id,
      fullName: emp.fullName,
      email: emp.email,
      role: emp.role,
      avatar: emp.avatar,
      studentsApproached: approached.length,
      studentsAdmitted: admitted.length,
      conversionRate,
    };
  });

  const totalLeads = leadsStats.length;
  const sortedByPerformance = [...leadsStats].sort(
    (a, b) => b.studentsAdmitted - a.studentsAdmitted,
  );
  const topLead = sortedByPerformance[0];
  const leastLead = sortedByPerformance[sortedByPerformance.length - 1];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Leads Performance"
        description="Track the performance of staff members and agents in converting students."
        actions={
          ['MARKETING_MANAGER', 'MANAGING_DIRECTOR', 'MARKETING_STAFF', 'SUB_AGENT', 'IT_ADMIN'].includes(
            session.role,
          ) && <AddLeadButton />
        }
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      {['MARKETING_MANAGER', 'MANAGING_DIRECTOR'].includes(session.role) &&
        leadsStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Employee Leads
                </CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-syne">{totalLeads}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Active staff members and agents
                </p>
              </CardContent>
            </Card>

            {topLead && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
                  <Trophy className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold truncate">{topLead.fullName}</div>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {topLead.studentsAdmitted} admitted from {topLead.studentsApproached}{' '}
                    approached
                  </p>
                </CardContent>
              </Card>
            )}

            {leastLead && leastLead.id !== topLead?.id && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Needs Improvement
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold truncate">{leastLead.fullName}</div>
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    {leastLead.studentsAdmitted} admitted from{' '}
                    {leastLead.studentsApproached} approached
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 font-syne">
            Leads Performance List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-medium text-gray-500">
                  Employee Lead
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Role</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">
                  Students Approached
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">
                  Students Admitted
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">
                  Conversion Rate
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leadsStats.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.fullName} size="lg" />
                      <div>
                        <p className="font-medium text-gray-900">{lead.fullName}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        lead.role === 'SUB_AGENT'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {lead.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">
                    {lead.studentsApproached}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">
                      {lead.studentsAdmitted} <ArrowUpRight size={14} />
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-full max-w-[60px] bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${lead.conversionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {lead.conversionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-primary font-medium hover:underline text-sm"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}

              {leadsStats.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No leads found matching your criteria.
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
