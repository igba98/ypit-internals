import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/backend';
import { Session, User } from '@/types';
import { EditStaffButton } from '../_components/EditStaffButton';
import { EquipmentClearanceCard } from '../_components/EquipmentClearanceCard';

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
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const { id } = await params;
  const record = await loadStaff(id);
  if (!record) notFound();

  const canSeeEquipment = ['IT_ADMIN', 'MANAGING_DIRECTOR'].includes(session.role);

  return (
    <div className="space-y-6">
      <GenericDetailPage
        title={`Staff Member: ${record.fullName}`}
        data={record as unknown as Record<string, unknown>}
        backPath="/staff"
        backLabel="Staff Directory"
        actions={<EditStaffButton staff={record} />}
      />
      {canSeeEquipment && (
        <div className="max-w-5xl mx-auto px-4 md:px-0 w-full">
          <EquipmentClearanceCard staffId={record.id} />
        </div>
      )}
    </div>
  );
}
