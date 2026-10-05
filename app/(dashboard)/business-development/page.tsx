import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pageAllowed } from '@/lib/permissions';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { BdEvent, CscaExamRecord, PartnershipRow, Session, Student } from '@/types';
import {
  CalendarDays,
  Handshake,
  Building2,
  UserPlus,
} from 'lucide-react';
import { EventsSection } from './_components/EventsSection';
import { PartnershipsSection } from './_components/PartnershipsSection';
import { CscaSection, StudentOption } from './_components/CscaSection';
import { listCscaExams } from '@/lib/actions/cscaActions';

const ALLOWED = ['MANAGING_DIRECTOR', 'MARKETING_STAFF', 'BUSINESS_DEVELOPMENT'];
const CAN_EDIT = ['MANAGING_DIRECTOR', 'BUSINESS_DEVELOPMENT'];

async function load(): Promise<{
  events: BdEvent[];
  partnerships: PartnershipRow[];
  error: string | null;
}> {
  try {
    const [evRes, paRes] = await Promise.all([
      backendFetch('/business-dev/events'),
      backendFetch('/business-dev/partnerships'),
    ]);
    if (!evRes.ok || !paRes.ok) {
      return {
        events: [],
        partnerships: [],
        error: `Failed to load (events HTTP ${evRes.status}, partnerships HTTP ${paRes.status}).`,
      };
    }
    const evBody = (await evRes.json()) as { items: BdEvent[] };
    const paBody = (await paRes.json()) as { items: PartnershipRow[] };
    return {
      events: evBody.items ?? [],
      partnerships: paBody.items ?? [],
      error: null,
    };
  } catch {
    return { events: [], partnerships: [], error: 'Unable to reach the backend.' };
  }
}

async function studentOptions(): Promise<StudentOption[]> {
  try {
    const res = await backendFetch('/students?limit=500');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: Student[] };
    return (body.items ?? []).map((s) => ({
      id: s.id,
      fullName: s.fullName,
      registrationNumber: s.registrationNumber,
    }));
  } catch {
    return [];
  }
}

export default async function BusinessDevelopmentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'business-dev', ALLOWED)) redirect('/dashboard');
  const canEdit = CAN_EDIT.includes(session.role);

  const { tab = 'events' } = await searchParams;
  const { events, partnerships, error } = await load();
  // Only the CSCA tab needs the exam list and the student picker.
  const [cscaExams, students] = await Promise.all([
    tab === 'csca' ? listCscaExams() : Promise.resolve<CscaExamRecord[]>([]),
    tab === 'csca' ? studentOptions() : Promise.resolve<StudentOption[]>([]),
  ]);

  const upcoming = events.filter(
    (e) => e.status === 'PLANNED' || e.status === 'ONGOING',
  );
  const leadsFromEvents = events.reduce((s, e) => s + e.leadsGenerated, 0);
  const activePartnerships = partnerships.filter(
    (p) =>
      p.partnership &&
      ['MOU_SIGNED', 'ACTIVE'].includes(p.partnership.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Development"
        description="Organise outreach events and manage university partnerships."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Upcoming Events" value={upcoming.length} icon={CalendarDays} />
        <KPICard label="Leads From Events" value={leadsFromEvents} icon={UserPlus} />
        <KPICard label="Universities" value={partnerships.length} icon={Building2} />
        <KPICard
          label="Active Partnerships"
          value={activePartnerships.length}
          icon={Handshake}
        />
      </div>

      <div className="flex items-center gap-1">
        {[
          { key: 'events', label: 'Events' },
          { key: 'partnerships', label: 'University Partnerships' },
          { key: 'csca', label: 'CSCA Examinations' },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.key === 'events' ? '/business-development' : `/business-development?tab=${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'csca' ? (
        cscaExams === null ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
            Unable to load the CSCA register.
          </p>
        ) : (
          <CscaSection exams={cscaExams} students={students} canEdit={canEdit} />
        )
      ) : tab === 'partnerships' ? (
        <PartnershipsSection rows={partnerships} canEdit={canEdit} />
      ) : (
        <EventsSection events={events} canEdit={canEdit} />
      )}
    </div>
  );
}
