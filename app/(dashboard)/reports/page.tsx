import { PageHeader } from '@/components/shared/PageHeader';
import { ReportsDashboard } from './_components/ReportsDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'FINANCE'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analytics & Reports" 
        description="Comprehensive overview of business performance and metrics."
        actions={
          <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Export Report
          </button>
        }
      />
      
      <ReportsDashboard />
    </div>
  );
}
