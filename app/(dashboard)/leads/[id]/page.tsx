import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockLeads } from '@/lib/mock/mockLeads';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const awaitedParams = await params;
  const record = mockLeads.find(p => p.id === awaitedParams.id);
  
  if (!record) notFound();
  
  return <GenericDetailPage title={`Lead Profile: ${record.fullName}`} data={record} backPath="/leads" backLabel="CRM Pipeline" />;
}
