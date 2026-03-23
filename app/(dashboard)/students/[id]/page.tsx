import { getStudentById } from '@/lib/mock/mockStudents';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PipelineStageBar } from '@/components/shared/PipelineStageBar';
import { StudentTabs } from './_components/StudentTabs';

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  const awaitedParams = await params;
  const student = getStudentById(awaitedParams.id);

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        <Link href="/students">Back to Students</Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shrink-0">
              {student.avatar ? (
                <img src={student.avatar} alt={student.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-medium">
                  {student.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-urbanist text-gray-900">{student.fullName}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-500 font-medium">{student.registrationNumber}</span>
                <StatusBadge status={student.pipelineStage} variant="pipeline" />
              </div>
            </div>
          </div>
          
          {['MANAGING_DIRECTOR', 'MARKETING_MANAGER'].includes(session.role) && (
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm font-medium transition-colors border border-gray-200">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
        
        <div className="mb-12">
          <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Pipeline Progress</h3>
          <PipelineStageBar currentStage={student.pipelineStage} />
        </div>
      </div>
      
      <StudentTabs student={student} userRole={session.role} />
    </div>
  );
}
