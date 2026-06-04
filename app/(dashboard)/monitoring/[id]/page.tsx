import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/backend';
import { CheckIn, OperationsRecord } from '@/types';
import { CheckInPanel } from './_components/CheckInPanel';
import { CheckInHistory } from './_components/CheckInHistory';

async function loadRecord(id: string): Promise<OperationsRecord | null> {
  try {
    const res = await backendFetch(`/monitoring/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as OperationsRecord;
  } catch {
    return null;
  }
}

async function loadCheckIns(id: string): Promise<CheckIn[]> {
  try {
    const res = await backendFetch(`/monitoring/${id}/check-ins`);
    if (!res.ok) return [];
    return (await res.json()) as CheckIn[];
  } catch {
    return [];
  }
}

export default async function MonitoringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const { id } = await params;
  const [record, checkIns] = await Promise.all([loadRecord(id), loadCheckIns(id)]);
  if (!record) notFound();

  return (
    <div className="space-y-6">
      <CheckInPanel record={record} />
      <CheckInHistory checkIns={checkIns} />
      <GenericDetailPage
        title={`Monitoring Report: ${record.studentName}`}
        data={record as unknown as Record<string, unknown>}
        backPath="/monitoring"
        backLabel="Student Monitoring"
      />
    </div>
  );
}
