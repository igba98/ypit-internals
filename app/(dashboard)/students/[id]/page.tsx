import { getStudentById } from '@/lib/mock/mockStudents';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ArrowLeft, Edit, Mail, Phone, MapPin, GraduationCap, Calendar, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { PipelineStageBar } from '@/components/shared/PipelineStageBar';
import { StudentTabs } from './_components/StudentTabs';
import { PipelineStatusSelect } from './_components/PipelineStatusSelect';
import { getStudentDetail } from '@/lib/studentDetail';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { ADMITTED_STAGES, Role } from '@/types';
import { canEdit } from '@/lib/statusOptions';

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');

  if (!sessionCookie) {
    redirect('/login');
  }

  const session = JSON.parse(sessionCookie.value) as { role: Role };
  const { id } = await params;
  const student = getStudentById(id);

  if (!student) {
    notFound();
  }

  const detail = getStudentDetail(student);
  const { payment, application, travel, documents } = detail;
  const isAdmitted = ADMITTED_STAGES.includes(student.pipelineStage);
  const canEditStage = canEdit('pipelineStage', session.role);

  return (
    <div className="space-y-6">
      <Link
        href="/students"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary-muted via-white to-white p-6 md:p-8 border-b border-gray-100">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/5" />
          <div className="absolute right-10 top-10 w-24 h-24 rounded-full bg-primary/10" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-card overflow-hidden border-4 border-white ring-1 ring-gray-100 shrink-0">
                  {student.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={student.avatar} alt={student.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary text-3xl font-bold bg-primary-muted">
                      {student.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                {isAdmitted && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center ring-2 ring-white" title="Admitted">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-urbanist text-gray-900">{student.fullName}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  <span className="text-sm text-gray-500 font-medium">{student.registrationNumber}</span>
                  <span className="text-gray-300 text-xs">•</span>
                  <PipelineStatusSelect
                    studentId={student.id}
                    value={student.pipelineStage}
                    editable={canEditStage}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {student.email}</span>
                  <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {student.phone}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {student.nationality}</span>
                  <span className="inline-flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-gray-400" /> {student.targetUniversity}, {student.targetCountry}</span>
                </div>
              </div>
            </div>

            {['MANAGING_DIRECTOR', 'MARKETING_MANAGER'].includes(session.role) && (
              <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors border border-gray-200 shadow-card h-fit">
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Quick stats strip */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="rounded-lg bg-white border border-gray-100 p-3 shadow-card">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Target Intake</p>
              <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {student.targetIntake}
              </p>
            </div>
            <div className="rounded-lg bg-white border border-gray-100 p-3 shadow-card">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Balance</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {payment ? formatCurrency(payment.balance, payment.currency) : <span className="text-gray-400">—</span>}
              </p>
            </div>
            <div className="rounded-lg bg-white border border-gray-100 p-3 shadow-card">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Application</p>
              <p className="text-sm font-bold text-gray-900 mt-1 truncate">
                {application ? application.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : <span className="text-gray-400">Not started</span>}
              </p>
            </div>
            <div className="rounded-lg bg-white border border-gray-100 p-3 shadow-card">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Travel</p>
              <p className="text-sm font-bold text-gray-900 mt-1 truncate">
                {travel ? travel.travelStatus.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : <span className="text-gray-400">Not started</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline progress */}
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Pipeline Progress</h3>
            <p className="text-xs text-gray-500">
              Joined {formatDate(student.createdAt)} · last updated {formatRelativeTime(student.updatedAt)}
            </p>
          </div>
          <PipelineStageBar currentStage={student.pipelineStage} />
        </div>
      </div>

      {/* Document count quick reference shown subtly below hero */}
      {documents.length > 0 && (
        <p className="text-xs text-gray-500 px-1">
          {documents.length} document{documents.length === 1 ? '' : 's'} on file
          {' · '}
          {documents.filter(d => d.verified).length} verified
        </p>
      )}

      <StudentTabs detail={detail} userRole={session.role} />
    </div>
  );
}
