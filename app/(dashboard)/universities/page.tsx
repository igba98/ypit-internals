import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { pageAllowed } from '@/lib/permissions';
import { Session, University } from '@/types';
import { Landmark, Globe2, Handshake, GraduationCap } from 'lucide-react';
import { UniversitiesTable } from './_components/UniversitiesTable';
import { UNI_READ_ROLES, UNI_WRITE_ROLES } from './_components/roles';


async function load(): Promise<{ universities: University[]; error: string | null }> {
  try {
    const res = await backendFetch('/finance/universities?limit=500');
    if (!res.ok) return { universities: [], error: `Failed to load (HTTP ${res.status}).` };
    const body = (await res.json()) as { items: University[] };
    return { universities: body.items ?? [], error: null };
  } catch {
    return { universities: [], error: 'Unable to reach the backend.' };
  }
}

export default async function UniversitiesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'catalog', UNI_READ_ROLES)) redirect('/dashboard');
  const canEdit = UNI_WRITE_ROLES.includes(session.role);

  const { universities, error } = await load();
  const local = universities.filter((u) => u.scope === 'LOCAL').length;
  const active = universities.filter((u) => u.partnership?.status === 'ACTIVE' || u.partnership?.status === 'MOU_SIGNED').length;
  const scholarships = universities.filter((u) => u.scholarshipNotes).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="University Management"
        description="Local and international universities - profiles, programmes, agreements, partnership status, and scholarship opportunities in one place."
      />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Universities" value={universities.length} icon={Landmark} />
        <KPICard label="Local / International" value={`${local} / ${universities.length - local}`} icon={Globe2} />
        <KPICard label="Active partnerships" value={active} icon={Handshake} />
        <KPICard label="With scholarships" value={scholarships} icon={GraduationCap} />
      </div>
      <UniversitiesTable universities={universities} canEdit={canEdit} />
    </div>
  );
}
