import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/backend';
import { User } from '@/types';
import { EditStaffButton } from '../_components/EditStaffButton';

async function loadStaff(id: string): Promise<User | null> {
  try {
    const res = await backendFetch(`/staff/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as User;
  } catch {
    return null;
  }
}

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const { id } = await params;
  const record = await loadStaff(id);
  if (!record) notFound();

  return (
    <GenericDetailPage
      title={`Staff Member: ${record.fullName}`}
      data={record as unknown as Record<string, unknown>}
      backPath="/staff"
      backLabel="Staff Directory"
      actions={<EditStaffButton staff={record} />}
    />
  );
}
