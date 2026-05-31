import { PageHeader } from '@/components/shared/PageHeader';
import { binFor } from '@/lib/tasks/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateTaskButton } from './_components/CreateTaskButton';
import { QuickPersonalTaskInput } from './_components/QuickPersonalTaskInput';
import { MyDayStrip } from './_components/MyDayStrip';
import { TaskCardGrid } from './_components/TaskCardGrid';
import { TaskKanban } from './_components/TaskKanban';
import { TaskListView } from './_components/TaskListView';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { backendFetch } from '@/lib/backend';

type Filter =
  | 'my-tasks'
  | 'assigned-by-me'
  | 'department'
  | 'personal'
  | 'needs-submit'
  | 'awaiting-review'
  | 'due-today'
  | 'overdue'
  | 'blocked';

const TABS: { value: Filter; label: string }[] = [
  { value: 'my-tasks', label: 'My Tasks' },
  { value: 'assigned-by-me', label: 'Assigned by Me' },
  { value: 'department', label: 'Department' },
  { value: 'personal', label: 'Personal' },
];

function applyFilter(
  tasks: Task[],
  filter: Filter,
  session: { userId: string; department: string },
): Task[] {
  const now = new Date();
  switch (filter) {
    case 'my-tasks':
      return tasks.filter((t) => t.assignedToIds.includes(session.userId));
    case 'assigned-by-me':
      return tasks.filter((t) => t.assignedById === session.userId);
    case 'department':
      return tasks.filter((t) => t.department === session.department);
    case 'personal':
      return tasks.filter(
        (t) => t.isPersonal && t.assignedToIds.includes(session.userId),
      );
    case 'needs-submit':
    case 'awaiting-review':
    case 'due-today':
    case 'overdue':
    case 'blocked':
      return tasks.filter((t) => binFor(t, session.userId, now) === filter);
  }
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Backend `GET /tasks` returns rows without the activity timeline (that's
 * only included by /tasks/:id). MyDayStrip / TaskCard / etc. don't read the
 * timeline at list level, but the frontend Task type insists it exists -
 * stamp an empty array so the cast is safe.
 */
function hydrateForListView(rows: Omit<Task, 'activity'>[]): Task[] {
  return rows.map((r) => ({ ...r, activity: [] } as Task));
}

async function fetchTasks(): Promise<{ tasks: Task[]; error: string | null }> {
  try {
    const res = await backendFetch('/tasks?limit=500');
    if (!res.ok) {
      return { tasks: [], error: `Failed to load tasks (HTTP ${res.status})` };
    }
    const body = (await res.json()) as { items: Omit<Task, 'activity'>[] };
    return { tasks: hydrateForListView(body.items ?? []), error: null };
  } catch {
    return { tasks: [], error: 'Unable to reach the backend.' };
  }
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value);
  const sp = await searchParams;

  const view = sp.view ?? 'grid';
  const filter = (sp.filter ?? 'my-tasks') as Filter;

  const { tasks, error } = await fetchTasks();
  const displayed = applyFilter(tasks, filter, session);

  const isBinFilter = [
    'needs-submit',
    'awaiting-review',
    'due-today',
    'overdue',
    'blocked',
  ].includes(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`My Day · ${formatToday()}`}
        description="What needs your attention today."
        actions={
          <div className="flex items-center gap-3">
            <QuickPersonalTaskInput />
            <CreateTaskButton currentUserId={session.userId} />
          </div>
        }
      />

      <MyDayStrip
        tasks={tasks}
        userId={session.userId}
        activeFilter={isBinFilter ? filter : undefined}
        view={view}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="flex gap-6 flex-wrap">
            {TABS.map((tab) => (
              <Link
                key={tab.value}
                href={`?view=${view}&filter=${tab.value}`}
                scroll={false}
                className={cn(
                  'pb-4 -mb-[17px] font-medium transition-colors',
                  filter === tab.value
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-900',
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-2">
            {(['grid', 'board', 'list'] as const).map((v) => (
              <Link
                key={v}
                href={`?view=${v}&filter=${filter}`}
                scroll={false}
                className={cn(
                  'p-2 rounded transition-colors capitalize',
                  view === v
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:bg-gray-50',
                )}
              >
                {v}
              </Link>
            ))}
          </div>
        </div>

        {view === 'grid' && (
          <TaskCardGrid initialTasks={displayed} currentUserId={session.userId} />
        )}
        {view === 'board' && (
          <TaskKanban initialTasks={displayed} currentUserId={session.userId} />
        )}
        {view === 'list' && (
          <TaskListView initialTasks={displayed} currentUserId={session.userId} />
        )}
      </div>
    </div>
  );
}
