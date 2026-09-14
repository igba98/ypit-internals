import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { pageAllowed } from '@/lib/permissions';
import { Session } from '@/types';
import { fetchFollowUpBoard, listAssignableStaff } from '@/lib/actions/studentFollowUpActions';
import { AlertTriangle, CalendarCheck, CalendarClock, ListChecks } from 'lucide-react';
import { FollowUpBoard } from './_components/FollowUpBoard';

const ALLOWED = ['OPERATIONS', 'MARKETING_MANAGER', 'MARKETING_STAFF', 'ADMISSIONS', 'TRAVEL', 'MANAGING_DIRECTOR'];

/** Module-level so the render stays pure (react-hooks/purity). */
function bucketCounts(items: { nextFollowUp?: string | null }[]) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let overdue = 0, today = 0, upcoming = 0;
  for (const f of items) {
    if (!f.nextFollowUp) continue;
    const t = new Date(f.nextFollowUp).getTime();
    if (t < todayStart) overdue++;
    else if (t < todayEnd) today++;
    else upcoming++;
  }
  return { overdue, today, upcoming };
}

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assignee?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'students', ALLOWED)) redirect('/dashboard');

  const params = await searchParams;
  const status = params.status === 'DONE' ? 'DONE' : params.status === 'ALL' ? 'ALL' : 'OPEN';
  const assignee = params.assignee === 'me' ? session.userId : params.assignee || undefined;

  const [items, staff] = await Promise.all([fetchFollowUpBoard(status, assignee), listAssignableStaff()]);
  const open = status === 'OPEN' ? items : items.filter((i) => i.actionStatus === 'OPEN');
  const { overdue, today, upcoming } = bucketCounts(open);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups Board"
        description="Every pending action across students - who owns it, who it involves, and when it is due. Overdue items surface first."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Pending actions" value={open.length} icon={ListChecks} />
        <KPICard label="Overdue" value={overdue} icon={AlertTriangle} />
        <KPICard label="Due today" value={today} icon={CalendarCheck} />
        <KPICard label="Upcoming" value={upcoming} icon={CalendarClock} />
      </div>
      <FollowUpBoard
        items={items}
        staff={staff}
        status={status}
        assignee={params.assignee ?? ''}
        currentUserId={session.userId}
      />
    </div>
  );
}
