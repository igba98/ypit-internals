import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { backendFetch } from '@/lib/backend';
import { canEdit, pageAllowed } from '@/lib/permissions';
import { listCommissions } from '@/lib/actions/commissionActions';
import { Session, Student, University } from '@/types';
import { CommissionsBoard } from './_components/CommissionsBoard';

const READ = ['BUSINESS_DEVELOPMENT', 'FINANCE', 'MARKETING_MANAGER', 'MANAGING_DIRECTOR'];
const WRITE = ['BUSINESS_DEVELOPMENT', 'FINANCE', 'MANAGING_DIRECTOR'];

async function options(): Promise<{ universities: University[]; students: Pick<Student, 'id' | 'fullName' | 'registrationNumber' | 'targetUniversity'>[] }> {
  try {
    const [u, s] = await Promise.all([
      backendFetch('/finance/universities?limit=500'),
      backendFetch('/students?limit=500'),
    ]);
    const universities = u.ok ? (((await u.json()) as { items: University[] }).items ?? []) : [];
    const students = s.ok ? (((await s.json()) as { items: Student[] }).items ?? []) : [];
    return {
      universities,
      students: students.map((x) => ({ id: x.id, fullName: x.fullName, registrationNumber: x.registrationNumber, targetUniversity: x.targetUniversity })),
    };
  } catch {
    return { universities: [], students: [] };
  }
}

/** University commissions ledger (system updates 2.0 §4). */
export default async function CommissionsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'commissions', READ)) redirect('/dashboard');
  const writable = canEdit(session, 'commissions', WRITE);

  const [ledger, opts] = await Promise.all([listCommissions(), options()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="University Commissions"
        description="What each university owes YPIT - per student or as lump sums - from expected, to invoiced, to received."
      />
      {!ledger ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">Unable to load commissions.</p>
      ) : (
        <CommissionsBoard ledger={ledger} universities={opts.universities} students={opts.students} canEdit={writable} />
      )}
    </div>
  );
}
