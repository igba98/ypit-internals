import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockApplications } from '@/lib/mock/mockApplications';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const awaitedParams = await params;
  const record = mockApplications.find(p => p.id === awaitedParams.id);
  
  if (!record) notFound();
  
  return <GenericDetailPage title={`Application Lifecycle: ${record.studentName}`} data={record} backPath="/applications" backLabel="Applications" />;
}
