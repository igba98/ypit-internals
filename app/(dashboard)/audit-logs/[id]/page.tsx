import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockAuditLogs } from '@/lib/mock/mockAuditLogs';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function AuditLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const awaitedParams = await params;
  const record = mockAuditLogs.find(p => p.id === awaitedParams.id);
  
  if (!record) notFound();
  
  return <GenericDetailPage title={`Security Event: ${record.action}`} data={record} backPath="/audit-logs" backLabel="Audit System" />;
}
