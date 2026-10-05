import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { backendFetch } from '@/lib/backend';
import { canEdit, pageAllowed } from '@/lib/permissions';
import { Session, User } from '@/types';
import { Boxes, FolderLock } from 'lucide-react';
import { listAppointments } from '@/lib/actions/hrActions';
import { AppointmentsSection } from './_components/AppointmentsSection';

const ALLOWED = ['OPERATIONS', 'MANAGING_DIRECTOR'];

async function staffOptions(): Promise<Pick<User, 'id' | 'fullName' | 'role'>[]> {
  try {
    const res = await backendFetch('/staff?limit=500&status=ACTIVE');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: User[] };
    return (body.items ?? [])
      .filter((u) => u.role !== 'SUB_AGENT')
      .map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }));
  } catch {
    return [];
  }
}

/**
 * Administration activities (IT change request, Oct 2026): the appointment
 * calendar, office documentation and office assets. HR activities are a
 * separate page.
 */
export default async function AdministrationPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'administration', ALLOWED)) redirect('/dashboard');

  const [appointments, staff] = await Promise.all([listAppointments(), staffOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Activities"
        description="The office appointment calendar. Office documentation and assets are kept in their own registers."
      />

      <div className="flex flex-wrap gap-2">
        <span className="px-3.5 py-1.5 rounded-md text-sm font-medium border bg-primary text-white border-primary">
          Appointment Calendar
        </span>
        <Link
          href="/records?tab=COMPANY"
          className="px-3.5 py-1.5 rounded-md text-sm font-medium border bg-white text-gray-700 border-gray-200 hover:border-primary inline-flex items-center gap-1.5"
        >
          <FolderLock className="w-3.5 h-3.5" /> Office Documentation
        </Link>
        <Link
          href="/assets"
          className="px-3.5 py-1.5 rounded-md text-sm font-medium border bg-white text-gray-700 border-gray-200 hover:border-primary inline-flex items-center gap-1.5"
        >
          <Boxes className="w-3.5 h-3.5" /> Office Assets
        </Link>
      </div>

      {appointments === null ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          Unable to load the calendar.
        </p>
      ) : (
        <AppointmentsSection
          appointments={appointments}
          staff={staff}
          canEdit={canEdit(session, 'administration', ALLOWED)}
        />
      )}
    </div>
  );
}
