import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { TravelTable } from './_components/TravelTable';
import { mockTravelRecords, getUpcomingDepartures } from '@/lib/mock/mockTravel';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plane, CheckCircle2, Calendar, Car } from 'lucide-react';

export default async function TravelPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['TRAVEL', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  const awaitingDeparture = mockTravelRecords.filter(t => t.travelStatus === 'READY').length;
  const visasApproved = mockTravelRecords.filter(t => t.visaStatus === 'APPROVED').length;
  const travelledThisMonth = mockTravelRecords.filter(t => t.travelStatus === 'TRAVELLED').length; // Simplified logic
  const pickupsArranged = mockTravelRecords.filter(t => t.airportPickupArranged).length;

  const awaitedSearchParams = await searchParams;
  const view = awaitedSearchParams.view || 'all';

  let displayedRecords = mockTravelRecords;
  if (view === 'upcoming') {
    displayedRecords = getUpcomingDepartures(30); // Next 30 days
  } else if (view === 'visa') {
    // Show records where visa is not yet approved, or all records to just track visas
    displayedRecords = mockTravelRecords.filter(t => t.visaStatus !== 'APPROVED');
    // If none are pending, just show all for demonstration purposes so it's not empty
    if (displayedRecords.length === 0) displayedRecords = mockTravelRecords;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Travel Management" 
        description="Manage student visas, flights, and accommodation."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Awaiting Departure" 
          value={awaitingDeparture} 
          icon={Calendar} 
        />
        <KPICard 
          label="Visas Approved" 
          value={visasApproved} 
          icon={CheckCircle2} 
        />
        <KPICard 
          label="Travelled This Month" 
          value={travelledThisMonth} 
          icon={Plane} 
        />
        <KPICard 
          label="Pickups Arranged" 
          value={pickupsArranged} 
          icon={Car} 
        />
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
