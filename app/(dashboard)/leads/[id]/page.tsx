import Image from 'next/image';
import { findUserById } from '@/lib/mock/mockUsers';
import { mockStudents } from '@/lib/mock/mockStudents';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Percent, Mail, Phone, Building2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ADMITTED_STAGES } from '@/types';

// Map month index (0-11) to Month Name
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = findUserById(id);
  
  if (!lead || !['MARKETING_STAFF', 'SUB_AGENT'].includes(lead.role)) {
    notFound();
  }

  // Get students assigned to this lead
  const assignedStudents = mockStudents.filter(s => s.assignedAgentId === id);
  
  // Overall stats
  const totalApproached = assignedStudents.length;
  const totalAdmitted = assignedStudents.filter(s => ADMITTED_STAGES.includes(s.pipelineStage)).length;
  const conversionRate = totalApproached > 0 ? Math.round((totalAdmitted / totalApproached) * 100) : 0;

  // Monthly stats (grouped by creation date)
  const monthlyData: Record<string, { approached: number, admitted: number }> = {};
  
  MONTHS.forEach(m => {
    monthlyData[m] = { approached: 0, admitted: 0 };
  });

  assignedStudents.forEach(student => {
    const date = new Date(student.createdAt);
    const month = MONTHS[date.getMonth()]; // Extract month string (e.g., 'Jan')
    
    if (month && monthlyData[month]) {
      monthlyData[month].approached += 1;
      
      if (ADMITTED_STAGES.includes(student.pipelineStage)) {
        monthlyData[month].admitted += 1;
      }
    }
  });

  // Convert monthlyData object to an array for easy rendering
  const monthlyStats = MONTHS.map(m => ({
    month: m,
    approached: monthlyData[m].approached,
    admitted: monthlyData[m].admitted
  })).filter(m => m.approached > 0 || m.admitted > 0); // Only show months with data

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/leads">Leads Performance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lead.fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Profile Header Design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {lead.avatar ? (
            <Image src={lead.avatar} alt={lead.fullName} width={96} height={96} className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl border-4 border-white shadow-sm">
              {lead.fullName.charAt(0)}
            </div>
          )}
          
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-syne">{lead.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  lead.role === 'SUB_AGENT' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {lead.role.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-500">
                  Joined {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {lead.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.department && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{lead.department} Department</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Approached</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-syne">{totalApproached}</div>
            <p className="text-xs text-gray-500 mt-1">Total leads assigned to this employee</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Admitted</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-syne text-green-600">{totalAdmitted}</div>
            <p className="text-xs text-gray-500 mt-1">Students successfully placed in university</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-syne">{conversionRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
              <div className="bg-primary rounded-full h-1.5" style={{ width: `${conversionRate}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Month</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">Approached</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">Admitted</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyStats.length > 0 ? (
                  monthlyStats.map((stat) => {
                    const rate = stat.approached > 0 ? Math.round((stat.admitted / stat.approached) * 100) : 0;
                    return (
                      <tr key={stat.month} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{stat.month} 2026</td>
                        <td className="px-6 py-4 text-center">{stat.approached}</td>
                        <td className="px-6 py-4 text-center text-green-600 font-bold">{stat.admitted}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-700">{rate}%</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No data available for this employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
