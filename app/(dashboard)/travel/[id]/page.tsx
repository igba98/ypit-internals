import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { TravelChecklistCard } from '@/components/pipeline/TravelChecklistCard';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Session, Student, TravelRecord } from '@/types';
import { backendFetch } from '@/lib/backend';
import { getTravelFinanceStatus } from '@/lib/actions/travelActions';
import { getStudentApprovals } from '@/lib/actions/financeApprovalActions';
import { FinanceCheckpoints } from '@/components/finance/FinanceCheckpoints';
import { FinanceClearanceCard } from './_components/FinanceClearanceCard';

async function loadTravel(id: string): Promise<TravelRecord | null> {
  try {
    const res = await backendFetch(`/travel/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as TravelRecord;
  } catch {
    return null;
  }
}

async function loadStudent(id: string): Promise<Student | null> {
  try {
    const res = await backendFetch(`/students/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as Student;
  } catch {
    return null;
  }
}

export default async function TravelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const { id } = await params;
  const record = await loadTravel(id);
  if (!record) notFound();

  const [student, financeStatus, approvals] = await Promise.all([
    loadStudent(record.studentId),
    getTravelFinanceStatus(id),
    // Travel clearance is only one of four sign-offs; showing just that one
    // read as "Finance is done" when the final settlement was still pending.
    getStudentApprovals(record.studentId),
  ]);
  const isFinance = session.role === 'FINANCE' || session.role === 'FINANCE_ASSISTANT';

  return (
    <div className="space-y-6">
      {financeStatus && (
        <FinanceClearanceCard
          travelId={id}
          studentName={record.studentName}
          status={financeStatus}
          isFinance={isFinance}
        />
      )}
      {approvals && approvals.items.length > 0 && (
        <FinanceCheckpoints
          approvals={approvals.items}
          outstanding={approvals.outstanding}
          pipelineStage={student?.pipelineStage}
        />
      )}

      {student && (
        <TravelChecklistCard
          studentId={student.id}
          studentName={student.fullName}
          travel={record}
          session={session}
        />
      )}
      <GenericDetailPage
        title={`Travel Logistics: ${record.studentName}`}
        data={record as unknown as Record<string, unknown>}
        backPath="/travel"
        backLabel="Travel Desk"
      />
    </div>
  );
}
