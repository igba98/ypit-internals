import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockPayments } from '@/lib/mock/mockPayments';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const awaitedParams = await params;
  const record = mockPayments.find((p: any) => p.id === awaitedParams.id);
  
  if (!record) notFound();
  
  return <GenericDetailPage title={`Payment Record: ${record.studentName}`} data={record} backPath="/payments" backLabel="Payments" />;
}
