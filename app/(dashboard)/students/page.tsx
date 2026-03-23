import { PageHeader } from '@/components/shared/PageHeader';
import { StudentsTable } from './_components/StudentsTable';
import { mockStudents } from '@/lib/mock/mockStudents';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AddStudentButton } from './_components/AddStudentButton';

export default async function StudentsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'FINANCE', 'ADMISSIONS', 'TRAVEL', 'OPERATIONS'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Students" 
        description="Manage all student records and their pipeline status."
        actions={
          ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'].includes(session.role) && (
            <AddStudentButton />
          )
        }
      />
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-400" /> 1 Lead
        </div>
        <div className="px-3 py-1 bg-blue-50 rounded-full text-xs font-medium text-blue-700 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> 1 Counseling
        </div>
        <div className="px-3 py-1 bg-amber-50 rounded-full text-xs font-medium text-amber-700 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" /> 1 Payment Pending
        </div>
        <div className="px-3 py-1 bg-green-50 rounded-full text-xs font-medium text-green-700 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" /> 1 Payment Confirmed
        </div>
      </div>
      
      <StudentsTable data={mockStudents} />
    </div>
  );
}
