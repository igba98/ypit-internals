import { PageHeader } from '@/components/shared/PageHeader';
import { ApplicationsTable } from './_components/ApplicationsTable';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MyQueue } from '@/components/pipeline/MyQueue';
import { Application, ApplicationStatus, Session } from '@/types';
import { backendFetch } from '@/lib/backend';

interface ApplicationsListResponse {
  items: Application[];
}

async function loadApplications(): Promise<{ items: Application[]; error: string | null }> {
  try {
    const res = await backendFetch('/applications?limit=100');
    if (!res.ok) return { items: [], error: `Failed to load applications (HTTP ${res.status})` };
    const body = (await res.json()) as ApplicationsListResponse;
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

const STATUS_PILL: Record<
  ApplicationStatus,
  { label: string; cls: string; dot: string }
> = {
  PREPARING:    { label: 'Preparing',    cls: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-500' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
  ACCEPTED:     { label: 'Accepted',     cls: 'bg-green-50 text-green-700',  dot: 'bg-green-500' },
  REJECTED:     { label: 'Rejected',     cls: 'bg-red-50 text-red-700',      dot: 'bg-red-500' },
  WAITLISTED:   { label: 'Waitlisted',   cls: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-500' },
  DEFERRED:     { label: 'Deferred',     cls: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
};

export default async function ApplicationsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');

  const session = JSON.parse(sessionCookie.value) as Session;

  const allowedRoles = ['ADMISSIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'OPERATIONS'];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');

  const { items: applications, error } = await loadApplications();

  const counts = applications.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<ApplicationStatus, number>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="University Applications"
        description="Track and manage student university applications."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <MyQueue session={session} title="Students Awaiting Application Action" />

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(STATUS_PILL) as ApplicationStatus[]).map((status) => {
          const meta = STATUS_PILL[status];
          const count = counts[status] ?? 0;
          return (
            <div
              key={status}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${meta.cls}`}
            >
              <div className={`w-2 h-2 rounded-full ${meta.dot}`} /> {count} {meta.label}
            </div>
          );
        })}
      </div>

      <ApplicationsTable data={applications} />
    </div>
  );
}
