import { PageHeader } from '@/components/shared/PageHeader';
import { SubagentsList } from './_components/SubagentsList';
import { mockUsers } from '@/lib/mock/mockUsers';
import { mockLeads } from '@/lib/mock/mockLeads';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SubagentsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');

  if (!sessionCookie) {
    redirect('/login');
  }

  const session = JSON.parse(sessionCookie.value);

  const allowedRoles = ['MARKETING_MANAGER', 'MANAGING_DIRECTOR'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  const subagents = mockUsers.filter(u => u.role === 'SUB_AGENT');

  // Compute stats
  const subagentsWithStats = subagents.map(agent => {
    const referredLeads = mockLeads.filter(l => l.assignedToId === agent.id || l.source === 'SUB_AGENT'); // simplistic but works for mock
    // to be more accurate, we should ideally check assignedToId
    const accurateReferredLeads = mockLeads.filter(l => l.assignedToId === agent.id);
    const convertedLeads = accurateReferredLeads.filter(l => l.status === 'CONVERTED');

    return {
      ...agent,
      totalLeads: accurateReferredLeads.length,
      convertedLeads: convertedLeads.length
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subagents Management"
        description="Manage partners and evaluate their performance."
      />

      <div className="bg-white rounded-xl shadow-card p-6">
        <SubagentsList subagents={subagentsWithStats} />
      </div>
    </div>
  );
}
