import { PageHeader } from '@/components/shared/PageHeader';
import { ApplicationsTable } from './_components/ApplicationsTable';
import { mockApplications } from '@/lib/mock/mockApplications';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ApplicationsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['ADMISSIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="University Applications" 
        description="Track and manage student university applications."
        actions={
          session.role === 'ADMISSIONS' && (
            <button className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Submit Report
            </button>
          )
        }
      />
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-400" /> 0 Preparing
        </div>
        <div className="px-3 py-1 bg-blue-50 rounded-full text-xs font-medium text-blue-700 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> 0 Submitted
        </div>
        <div className="px-3 py-1 bg-yellow-50 rounded-full text-xs font-medium text-yellow-700 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500" /> 1 Under Review
        </div>
        <div className="px-3 py-1 bg-green-50 rounded-full text-xs font-medium text-green-700 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" /> 4 Accepted
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <ApplicationsTable data={mockApplications} />
      </div>
    </div>
  );
}
