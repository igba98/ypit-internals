import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockTravelRecords } from '@/lib/mock/mockTravel';
import { mockStudents } from '@/lib/mock/mockStudents';
import { TravelChecklistCard } from '@/components/pipeline/TravelChecklistCard';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Session } from '@/types';

export default async function TravelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const awaitedParams = await params;
  const record = mockTravelRecords.find(p => p.id === awaitedParams.id);

  if (!record) notFound();

  const student = mockStudents.find(s => s.id === record.studentId);

  return (
    <div className="space-y-6">
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
        data={record}
        backPath="/travel"
        backLabel="Travel Desk"
      />
    </div>
  );
}