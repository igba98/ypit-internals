import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { backendFetch } from '@/lib/backend';
import { canEdit, pageAllowed } from '@/lib/permissions';
import { Session, User } from '@/types';
import { FolderLock, Users } from 'lucide-react';
import {
  listFoodBudgets,
  listFoodSchedule,
  listTrainings,
} from '@/lib/actions/hrActions';
import { TrainingSection } from './_components/TrainingSection';
import { FoodBudgetSection, FoodScheduleSection } from './_components/FoodSection';

const ALLOWED = ['OPERATIONS', 'MANAGING_DIRECTOR'];

const TABS = [
  { key: 'TRAINING', label: 'Training & Orientations' },
  { key: 'FOOD_SCHEDULE', label: 'Food Schedule' },
  { key: 'FOOD_BUDGET', label: 'Monthly Food Budget' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

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
 * HR activities (IT change request, Oct 2026). Office administration is a
 * separate page on purpose - the two were never to be shown as one list.
 */
export default async function HrPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'hr', ALLOWED)) redirect('/dashboard');

  const { tab } = await searchParams;
  const active: TabKey = TABS.some((t) => t.key === tab) ? (tab as TabKey) : 'TRAINING';
  const editable = canEdit(session, 'hr', ALLOWED);

  const [trainings, foodSchedule, budgets, staff] = await Promise.all([
    active === 'TRAINING' ? listTrainings() : Promise.resolve([]),
    active === 'FOOD_SCHEDULE' ? listFoodSchedule() : Promise.resolve([]),
    active === 'FOOD_BUDGET' ? listFoodBudgets() : Promise.resolve([]),
    active === 'TRAINING' ? staffOptions() : Promise.resolve([]),
  ]);

  const failed =
    (active === 'TRAINING' && trainings === null) ||
    (active === 'FOOD_SCHEDULE' && foodSchedule === null) ||
    (active === 'FOOD_BUDGET' && budgets === null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Activities"
        description="Training and orientations, the food schedule and the monthly food budget. Staff, intern and field documentation lives in Company Records."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/hr?tab=${t.key}`}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              active === t.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
            }`}
          >
            {t.label}
          </Link>
        ))}
        {/* The documentation tabs are HR activities too - they already live in
            Company Records, so link rather than duplicate them. */}
        <Link
          href="/records?tab=EMPLOYEE"
          className="px-3.5 py-1.5 rounded-md text-sm font-medium border bg-white text-gray-700 border-gray-200 hover:border-primary inline-flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5" /> Staff Documentation
        </Link>
        <Link
          href="/records?tab=INTERN"
          className="px-3.5 py-1.5 rounded-md text-sm font-medium border bg-white text-gray-700 border-gray-200 hover:border-primary inline-flex items-center gap-1.5"
        >
          <FolderLock className="w-3.5 h-3.5" /> Interns &amp; Field
        </Link>
      </div>

      {failed && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          Unable to load this section.
        </p>
      )}

      {active === 'TRAINING' && (
        <TrainingSection sessions={trainings ?? []} staff={staff ?? []} canEdit={editable} />
      )}
      {active === 'FOOD_SCHEDULE' && (
        <FoodScheduleSection entries={foodSchedule ?? []} canEdit={editable} />
      )}
      {active === 'FOOD_BUDGET' && (
        <FoodBudgetSection budgets={budgets ?? []} canEdit={editable} />
      )}
    </div>
  );
}
