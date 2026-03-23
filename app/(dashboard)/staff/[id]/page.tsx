import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockUsers } from '@/lib/mock/mockUsers';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const awaitedParams = await params;
  const record = mockUsers.find((p: any) => p.id === awaitedParams.id);
  
  if (!record) notFound();
  
  return <GenericDetailPage title={`Staff Member: ${record.fullName}`} data={record} backPath="/staff" backLabel="Staff Directory" />;
}
