import { PageHeader } from '@/components/shared/PageHeader';
import { LeadsKanban } from './_components/LeadsKanban';
import { mockLeads } from '@/lib/mock/mockLeads';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AddLeadButton } from './_components/AddLeadButton';

export default async function LeadsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['MARKETING_MANAGER', 'MARKETING_STAFF', 'SUB_AGENT', 'MANAGING_DIRECTOR'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  // Filter leads for staff/agents
  let leads = mockLeads;
  if (['MARKETING_STAFF', 'SUB_AGENT'].includes(session.role)) {
    leads = mockLeads.filter(l => l.assignedToId === session.userId);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Leads Management" 
        description="Track and convert prospective students."
        actions={
          <AddLeadButton />
        }
      />
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="flex gap-6">
            <button className="text-primary font-medium border-b-2 border-primary pb-4 -mb-[17px]">Board View</button>
            <button className="text-gray-500 hover:text-gray-900 pb-4 -mb-[17px]">Table View</button>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">Filter</button>
          </div>
        </div>
        
        <LeadsKanban initialLeads={leads} />
      </div>
    </div>
  );
}
