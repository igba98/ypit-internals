import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { backendFetch } from '@/lib/backend';
import { canEdit, pageAllowed } from '@/lib/permissions';
import { listRecords } from '@/lib/actions/adminRecordActions';
import { Session, User } from '@/types';
import { RecordsBoard } from './_components/RecordsBoard';

const ALLOWED = ['OPERATIONS', 'MANAGING_DIRECTOR'];

async function staffOptions(): Promise<Pick<User, 'id' | 'fullName' | 'role'>[]> {
  try {
    const res = await backendFetch('/staff?limit=500');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: User[] };
    return (body.items ?? []).filter((u) => u.role !== 'SUB_AGENT').map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }));
  } catch {
    return [];
  }
}

/** Company documents + personnel files (system updates 2.0 §5). */
export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'records', ALLOWED)) redirect('/dashboard');

  const { tab } = await searchParams;
  const [records, staff] = await Promise.all([listRecords(), staffOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Records"
        description="Company documents and personnel files for employees, interns and field workers - with expiry tracking."
      />
      {records === null ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">Unable to load records.</p>
      ) : (
        <RecordsBoard
          records={records}
          staff={staff}
          initialTab={tab === 'EMPLOYEE' || tab === 'INTERN' || tab === 'FIELD' ? tab : 'COMPANY'}
          canEdit={canEdit(session, 'records', ALLOWED)}
        />
      )}
    </div>
  );
}
