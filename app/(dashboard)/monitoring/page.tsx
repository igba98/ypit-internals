import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { MonitoringTable } from './_components/MonitoringTable';
import { mockOperationsRecords } from '@/lib/mock/mockOperations';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default async function MonitoringPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['OPERATIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  const studentsAbroad = mockOperationsRecords.length;
  const checkInsThisWeek = mockOperationsRecords.reduce((sum, o) => sum + o.checkInCount, 0); // Simplified
  const escalations = mockOperationsRecords.filter(o => o.escalationFlag).length;
  const enrolledAndSettled = mockOperationsRecords.filter(o => o.enrollmentConfirmed).length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Student Monitoring" 
        description="Monitor student wellbeing and enrollment status abroad."
      />
      
      {escalations > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Action Required: Escalated Students</h3>
            <p className="text-sm text-red-600 mt-1">
              There are {escalations} students requiring immediate attention.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Students Abroad" 
          value={studentsAbroad} 
          icon={Users} 
        />
        <KPICard 
          label="Check-ins This Week" 
          value={checkInsThisWeek} 
          icon={Activity} 
        />
        <KPICard 
          label="Escalations" 
          value={escalations} 
          icon={AlertTriangle} 
          className={escalations > 0 ? "border-red-200 bg-red-50" : ""}
        />
        <KPICard 
          label="Enrolled & Settled" 
          value={enrolledAndSettled} 
          icon={CheckCircle2} 
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <MonitoringTable data={mockOperationsRecords} />
      </div>
    </div>
  );
}
