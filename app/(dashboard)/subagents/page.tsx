import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { SubagentsList } from './_components/SubagentsList';
import { AddSubagentButton } from './_components/AddSubagentButton';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pageAllowed } from '@/lib/permissions';
import { backendFetch } from '@/lib/backend';
import { Session, SubAgentSummary } from '@/types';
import { KPICard } from '@/components/shared/KPICard';
import { Users, FileSignature, Plane, Target } from 'lucide-react';

async function loadSubagents(): Promise<{ items: SubAgentSummary[]; error: string | null }> {
  try {
    const res = await backendFetch('/subagents');
    if (!res.ok) return { items: [], error: `Failed to load sub-agents (HTTP ${res.status})` };
    const body = (await res.json()) as { items: SubAgentSummary[] };
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

export default async function SubagentsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const allowedRoles = ['MARKETING_MANAGER', 'MANAGING_DIRECTOR', 'OPERATIONS', 'BUSINESS_DEVELOPMENT'];
  if (!pageAllowed(session, 'subagents', allowedRoles)) redirect('/dashboard');

  const canAdd = ['BUSINESS_DEVELOPMENT', 'MARKETING_MANAGER', 'MANAGING_DIRECTOR', 'IT_ADMIN'].includes(session.role);
  const { items: subagents, error } = await loadSubagents();

  const activeContracts = subagents.filter((s) => s.contract?.status === 'ACTIVE').length;
  const totalRecruited = subagents.reduce((sum, s) => sum + s.stats.studentsRecruited, 0);
  const totalTravelled = subagents.reduce((sum, s) => sum + s.stats.studentsTravelled, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subagents Management"
        description="Recruit sub-agents, share their application link, and track contracts and KPIs."
        actions={canAdd ? <AddSubagentButton /> : undefined}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Sub-agents" value={subagents.length} icon={Users} />
        <KPICard label="Active Contracts" value={`${activeContracts}/${subagents.length}`} icon={FileSignature} />
        <KPICard label="Students Recruited" value={totalRecruited} icon={Target} />
        <KPICard label="Students Travelled" value={totalTravelled} icon={Plane} />
      </div>

      <p className="text-xs text-gray-600 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2">
        Share each agent&apos;s <b>application link</b> - applications submitted through it (or with the agent code typed in)
        arrive in Website Enquiries already credited to that agent. Full KPIs are under{' '}
        <Link href="/leads?kind=SUB_AGENT" className="text-primary hover:underline">Sub-agent KPIs</Link>.
      </p>

      <SubagentsList subagents={subagents} />
    </div>
  );
}
