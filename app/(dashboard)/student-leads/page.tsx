import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRO, LEAD_DISTRIBUTOR_ROLES, pageAllowed } from '@/lib/permissions';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { Lead, User } from '@/types';
import { GraduationCap, UserPlus, CheckCircle2 } from 'lucide-react';
import { AddStudentLeadButton } from './_components/AddStudentLeadButton';
import { LeadsTable, Officer } from './_components/LeadsTable';

const ALLOWED = [
  'SUB_AGENT',
  'MARKETING_MANAGER',
  'MARKETING_STAFF',
  'TRAVEL',
  'MANAGING_DIRECTOR',
  'IT_ADMIN',
];

interface LeadsResponse {
  items: (Lead & { createdById?: string })[];
}

/** Relations Officers + sub-agents who can receive leads. */
async function loadOfficers(): Promise<Officer[]> {
  try {
    const res = await backendFetch('/staff?limit=500&status=ACTIVE');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: User[] };
    return (body.items ?? [])
      .filter((u) => ['MARKETING_STAFF', 'TRAVEL', 'SUB_AGENT'].includes(u.role))
      .sort((a, b) => (a.role === 'SUB_AGENT' ? 1 : 0) - (b.role === 'SUB_AGENT' ? 1 : 0) || a.fullName.localeCompare(b.fullName))
      .map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }));
  } catch {
    return [];
  }
}

async function load(
  status?: string,
): Promise<{ items: (Lead & { createdById?: string })[]; error: string | null }> {
  try {
    const params = new URLSearchParams({ limit: '500' });
    if (status === 'unassigned') params.set('unassigned', 'true');
    else if (status && status !== 'all') params.set('status', status);
    const res = await backendFetch(`/leads?${params.toString()}`);
    if (!res.ok)
      return { items: [], error: `Failed to load leads (HTTP ${res.status}).` };
    const body = (await res.json()) as LeadsResponse;
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'COUNSELED', label: 'Counseled' },
  { key: 'CONVERTED', label: 'Converted' },
  { key: 'LOST', label: 'Lost' },
];

export default async function StudentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as {
    role: string;
    userId: string;
  };
  if (!pageAllowed(session, 'leads', ALLOWED)) redirect('/dashboard');

  const { status = 'all' } = await searchParams;
  const canDistribute = LEAD_DISTRIBUTOR_ROLES.includes(session.role);
  const [{ items, error }, officers] = await Promise.all([
    load(status),
    canDistribute ? loadOfficers() : Promise.resolve([] as Officer[]),
  ]);
  const ro = isRO(session.role);

  // Sub-agents only see the leads they own.
  const visible =
    session.role === 'SUB_AGENT'
      ? items.filter(
          (l) =>
            l.assignedToId === session.userId ||
            l.createdById === session.userId,
        )
      : items;

  const converted = visible.filter((l) => l.status === 'CONVERTED').length;
  const open = visible.filter(
    (l) => l.status !== 'CONVERTED' && l.status !== 'LOST',
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ro ? 'My Leads' : 'Student Leads'}
        description={
          ro
            ? 'Leads handed to you by IT, plus the ones you capture. Move them through Contacted → Counseled, then convert to a student.'
            : 'Capture prospective students, hand them to Relations Officers and track them through the pipeline.'
        }
        actions={<AddStudentLeadButton />}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Total Leads" value={visible.length} icon={GraduationCap} />
        <KPICard label="Open" value={open} icon={UserPlus} />
        <KPICard label="Converted" value={converted} icon={CheckCircle2} />
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-3 flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.filter((t) => canDistribute || t.key !== 'unassigned').map((t) => (
            <Link
              key={t.key}
              href={t.key === 'all' ? '/student-leads' : `/student-leads?status=${t.key}`}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                status === t.key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

      </div>

      <LeadsTable
        leads={visible}
        officers={officers}
        canDistribute={canDistribute}
        canWork
      />
    </div>
  );
}
