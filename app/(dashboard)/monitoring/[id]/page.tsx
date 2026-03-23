import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockOperationsRecords } from '@/lib/mock/mockOperations';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function MonitoringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const awaitedParams = await params;
  const record = mockOperationsRecords.find(p => p.id === awaitedParams.id);
  
  if (!record) notFound();
  
  return <GenericDetailPage title={`Monitoring Report: ${record.studentName}`} data={record} backPath="/monitoring" backLabel="Student Monitoring" />;
}
