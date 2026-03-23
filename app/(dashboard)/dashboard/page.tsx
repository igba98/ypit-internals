import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Users, Target, DollarSign, Plane } from 'lucide-react';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Welcome back, ${session.fullName.split(' ')[0]}`}
        description={today}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Total Students" 
          value="524" 
          icon={Users} 
          trend="12%" 
          trendDirection="up" 
          description="vs last month" 
        />
        <KPICard 
          label="Active Leads" 
          value="89" 
          icon={Target} 
          trend="5%" 
          trendDirection="up" 
          description="vs last month" 
        />
        <KPICard 
          label="Revenue Collected" 
          value="TZS 45M" 
          icon={DollarSign} 
          trend="2%" 
          trendDirection="up" 
          description="vs last month" 
        />
        <KPICard 
          label="Students Travelled" 
          value="12" 
          icon={Plane} 
          trend="3" 
          trendDirection="down" 
          description="vs last month" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6 h-96 flex items-center justify-center text-gray-400">
          Monthly Intake Chart Placeholder
        </div>
        <div className="bg-white rounded-xl shadow-card p-6 h-96 flex items-center justify-center text-gray-400">
          Pipeline Stage Donut Placeholder
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6 h-96 flex items-center justify-center text-gray-400">
          Recent Activity Feed Placeholder
        </div>
        <div className="bg-white rounded-xl shadow-card p-6 h-96 flex items-center justify-center text-gray-400">
          Department Reports Placeholder
        </div>
      </div>
    </div>
  );
}
