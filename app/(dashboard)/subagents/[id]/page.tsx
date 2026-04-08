import { PageHeader } from '@/components/shared/PageHeader';
import { mockUsers } from '@/lib/mock/mockUsers';
import { mockLeads } from '@/lib/mock/mockLeads';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Mail, Phone, Calendar } from 'lucide-react';
import Link from 'next/link';
import { LeadsKanban } from '../../leads/_components/LeadsKanban';

export default async function SubagentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Next 15 specific, might need await on params
  const { id } = await Promise.resolve(params);

  const subagent = mockUsers.find(u => u.id === id && u.role === 'SUB_AGENT');

  if (!subagent) {
    notFound();
  }

  const assignedLeads = mockLeads.filter(l => l.assignedToId === subagent.id);
  const convertedLeads = assignedLeads.filter(l => l.status === 'CONVERTED');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/subagents" className="text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to Subagents
        </Link>
      </div>

      <PageHeader
        title={`Subagent: ${subagent.fullName}`}
        description="View details and manage leads referred by this subagent."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Subagent Info Card */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden shrink-0">
                {subagent.avatar ? (
                  <img src={subagent.avatar} alt={subagent.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-medium">
                    {subagent.fullName.charAt(0)}
                  </div>
                )}
              </div>
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
                Joined {new Date(subagent.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-bold text-gray-900 mb-4">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">{assignedLeads.length}</div>
                <div className="text-sm text-gray-500 mt-1">Total Leads</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{convertedLeads.length}</div>
                <div className="text-sm text-gray-500 mt-1">Converted</div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {/* Leads Board */}
          <div className="bg-white rounded-xl shadow-card p-6">
             <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900">Referred Leads</h3>
            </div>

            {assignedLeads.length > 0 ? (
              <LeadsKanban initialLeads={assignedLeads} />
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                No leads referred yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
