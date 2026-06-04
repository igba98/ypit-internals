import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { TravelTable } from './_components/TravelTable';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plane, CheckCircle2, Calendar, Car } from 'lucide-react';
import { MyQueue } from '@/components/pipeline/MyQueue';
import { Session, TravelRecord } from '@/types';
import { backendFetch } from '@/lib/backend';

interface TravelListResponse {
  items: TravelRecord[];
}

async function loadTravel(): Promise<{ items: TravelRecord[]; error: string | null }> {
  try {
    const res = await backendFetch('/travel?limit=100');
    if (!res.ok) return { items: [], error: `Failed to load travel records (HTTP ${res.status})` };
    const body = (await res.json()) as TravelListResponse;
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

function within(d: string | undefined, days: number): boolean {
  if (!d) return false;
  const dt = new Date(d).getTime();
  if (Number.isNaN(dt)) return false;
  const now = Date.now();
  const end = now + days * 24 * 60 * 60 * 1000;
  return dt >= now && dt <= end;
}

function inCurrentMonth(d: string | undefined): boolean {
  if (!d) return false;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return false;
  const now = new Date();
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
}

export default async function TravelPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');

  const session = JSON.parse(sessionCookie.value) as Session;

  const allowedRoles = ['TRAVEL', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS', 'OPERATIONS'];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');

  const { items: records, error } = await loadTravel();

  const awaitingDeparture = records.filter((t) => t.travelStatus === 'READY').length;
  const visasApproved = records.filter((t) => t.visaStatus === 'APPROVED').length;
  const travelledThisMonth = records.filter(
    (t) => t.travelStatus === 'TRAVELLED' && inCurrentMonth(t.flightDate ?? t.updatedAt),
  ).length;
  const pickupsArranged = records.filter((t) => t.airportPickupArranged).length;

  const { view = 'all' } = await searchParams;

  let displayedRecords = records;
  if (view === 'upcoming') {
    displayedRecords = records.filter((t) => within(t.flightDate, 30));
  } else if (view === 'visa') {
    displayedRecords = records.filter((t) => t.visaStatus !== 'APPROVED');
    if (displayedRecords.length === 0) displayedRecords = records;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Travel Management"
        description="Manage student visas, flights, and accommodation."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <MyQueue session={session} title="Students In Travel Planning" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Awaiting Departure" value={awaitingDeparture} icon={Calendar} />
        <KPICard label="Visas Approved" value={visasApproved} icon={CheckCircle2} />
        <KPICard label="Travelled This Month" value={travelledThisMonth} icon={Plane} />
        <KPICard label="Pickups Arranged" value={pickupsArranged} icon={Car} />
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="flex gap-6">
            <Link href="?view=all" scroll={false} className={`pb-4 -mb-[17px] font-medium transition-colors ${view === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}>
              All Students
            </Link>
            <Link href="?view=upcoming" scroll={false} className={`pb-4 -mb-[17px] font-medium transition-colors ${view === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}>
              Upcoming Departures
            </Link>
            <Link href="?view=visa" scroll={false} className={`pb-4 -mb-[17px] font-medium transition-colors ${view === 'visa' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}>
              Visa Tracker
            </Link>
          </div>
        </div>

        <TravelTable data={displayedRecords} />
      </div>
    </div>
  );
}
