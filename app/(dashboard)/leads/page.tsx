import { PageHeader } from '@/components/shared/PageHeader';
import { mockUsers } from '@/lib/mock/mockUsers';
import { mockStudents } from '@/lib/mock/mockStudents';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users, Trophy, AlertCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ADMITTED_STAGES = ['UNIVERSITY_ACCEPTED', 'TRAVEL_PLANNING', 'TRAVELLED', 'MONITORING'];

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

  // 1. Identify "Leads" as employees (Marketing Staff and Sub Agents)
  let employeeLeads = mockUsers.filter(u => u.role === 'MARKETING_STAFF' || u.role === 'SUB_AGENT');

  // If a standard staff member is viewing, they only see themselves
  if (['MARKETING_STAFF', 'SUB_AGENT'].includes(session.role)) {
    employeeLeads = employeeLeads.filter(u => u.id === session.userId);
  }

  // 2. Calculate performance metrics for each employee
  const leadsStats = employeeLeads.map(emp => {
    const approached = mockStudents.filter(s => s.assignedAgentId === emp.id);
    const admitted = approached.filter(s => ADMITTED_STAGES.includes(s.pipelineStage));
    const conversionRate = approached.length > 0 
      ? Math.round((admitted.length / approached.length) * 100) 
      : 0;

    return {
      ...emp,
      studentsApproached: approached.length,
      studentsAdmitted: admitted.length,
      conversionRate
    };
  });

  // 3. Summary stats
  const totalLeads = leadsStats.length;
  const sortedByPerformance = [...leadsStats].sort((a, b) => b.studentsAdmitted - a.studentsAdmitted);
  
  const topLead = sortedByPerformance[0];
  const leastLead = sortedByPerformance[sortedByPerformance.length - 1];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Employee Leads Performance" 
        description="Track the performance of staff members and agents in converting students."
      />
      
      {/* Summary KPI Cards using Shadcn Card */}
      {['MARKETING_MANAGER', 'MANAGING_DIRECTOR'].includes(session.role) && leadsStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employee Leads</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-syne">{totalLeads}</div>
              <p className="text-xs text-gray-500 mt-1">Active staff members and agents</p>
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
                  {topLead.studentsAdmitted} admitted from {topLead.studentsApproached} approached
                </p>
              </CardContent>
            </Card>
          )}

          {leastLead && leastLead.id !== topLead?.id && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{leastLead.fullName}</div>
                <p className="text-xs text-orange-600 font-medium mt-1">
                  {leastLead.studentsAdmitted} admitted from {leastLead.studentsApproached} approached
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 font-syne">Leads Performance List</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Employee Lead</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Role</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">Students Approached</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">Students Admitted</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">Conversion Rate</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leadsStats.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {lead.avatar ? (
                        <img src={lead.avatar} alt={lead.fullName} width={40} height={40} className="rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-muted text-primary flex items-center justify-center font-bold">
                          {lead.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{lead.fullName}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      lead.role === 'SUB_AGENT' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'
                    }`}>
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
                      <span className="text-sm font-medium text-gray-700">{lead.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/leads/${lead.id}`} className="text-primary font-medium hover:underline text-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              
              {leadsStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
