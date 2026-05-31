import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ArrowLeft, Edit, Mail, Phone, MapPin, GraduationCap, Calendar, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { PipelineStageBar } from '@/components/shared/PipelineStageBar';
import { Avatar } from '@/components/shared/Avatar';
import { StudentTabs } from './_components/StudentTabs';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import {
  ADMITTED_STAGES,
  Application,
  Guardian,
  Notification,
  PaymentRecord,
  Session,
  StageTransition,
  Student,
  TravelRecord,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvanceStageButton } from '@/components/pipeline/AdvanceStageButton';
import { RevertStageButton } from '@/components/pipeline/RevertStageButton';
import { StageTimeline } from '@/components/pipeline/StageTimeline';
import { SentMessagesPanel } from '@/components/pipeline/SentMessagesPanel';
import { GuardiansSection } from '@/components/pipeline/GuardiansSection';
import { TravelChecklistCard } from '@/components/pipeline/TravelChecklistCard';
import { ActivityEvent } from '@/lib/studentDetail';
import { backendFetch } from '@/lib/backend';

interface DetailResponse extends Student {
  guardians: Guardian[];
  paymentRecord: PaymentRecord | null;
  application: Application | null;
  applications: Application[];
  travelRecord: TravelRecord | null;
  stageTransitions: StageTransition[];
  notifications: Notification[];
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const { id } = await params;

  const res = await backendFetch(`/students/${id}/detail`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="space-y-4">
        <Link href="/students" className="text-sm text-gray-500">
          ← Back to Students
        </Link>
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          Failed to load student (HTTP {res.status}).
        </p>
      </div>
    );
  }
  const data = (await res.json()) as DetailResponse;

  const { guardians, paymentRecord, application, travelRecord, stageTransitions, notifications } = data;
  const student = data as Student;
  const payment = paymentRecord;
  const travel = travelRecord;

  // Activity for the Activity Log tab is synthesised from stage transitions.
  // Document / check-in feeds will be added when those modules ship.
  const activity: ActivityEvent[] = stageTransitions.map((t) => ({
    id: t.id,
    kind: 'STAGE',
    title: `${t.fromStage.replace(/_/g, ' ')} → ${t.toStage.replace(/_/g, ' ')}`.toLowerCase(),
    description: t.notes ?? undefined,
    actor: t.triggeredByName,
    timestamp: t.createdAt,
  }));

  const detail = {
    student,
    payment,
    application,
    travel,
    documents: [],
    activity,
  };

  const isAdmitted = ADMITTED_STAGES.includes(student.pipelineStage);

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
                <div className="border-4 border-white ring-1 ring-gray-100 rounded-2xl shadow-card overflow-hidden">
                  <Avatar
                    name={student.fullName}
                    size="xl"
                    className="w-20 h-20 rounded-2xl text-3xl"
                  />
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
                  <span className="text-sm font-medium text-gray-700">
                    {student.pipelineStage.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <AdvanceStageButton student={student} session={session} travel={travel} size="sm" />
                  <RevertStageButton student={student} session={session} />
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
                {payment ? formatCurrency(payment.balance, { currency: payment.currency }) : <span className="text-gray-400">-</span>}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Guardians</CardTitle></CardHeader>
          <CardContent>
            <GuardiansSection studentId={student.id} guardians={guardians} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stage Timeline</CardTitle></CardHeader>
          <CardContent>
            <StageTimeline transitions={stageTransitions} />
          </CardContent>
        </Card>
      </div>

      {/* Travel substep walkthrough - shown whenever a TravelRecord exists.
          This is where the user clicks through passport → visa → flight → arrival,
          and the TRAVEL_PLANNING → TRAVELLED transition won't unlock until all 4 are DONE. */}
      {travel && (
        <TravelChecklistCard
          studentId={student.id}
          studentName={student.fullName}
          travel={travel}
          session={session}
        />
      )}

      <Card>
        <CardHeader><CardTitle>Sent Messages (Simulated WhatsApp)</CardTitle></CardHeader>
        <CardContent>
          <SentMessagesPanel notifications={notifications} />
        </CardContent>
      </Card>

      <StudentTabs detail={detail} userRole={session.role} />
    </div>
  );
}
