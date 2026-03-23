import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockTravelRecords } from '@/lib/mock/mockTravel';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function TravelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const awaitedParams = await params;
  const record = mockTravelRecords.find(p => p.id === awaitedParams.id);
  
  if (!record) notFound();
  
  return <GenericDetailPage title={`Travel Logistics: ${record.studentName}`} data={record} backPath="/travel" backLabel="Travel Desk" />;
}
