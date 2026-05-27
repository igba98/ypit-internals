import Link from 'next/link';
import { Task } from '@/types';
import { binFor, DayBin } from '@/lib/tasks/permissions';
import { CheckCircle2, FileSearch, CalendarClock, AlertOctagon, Pause, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TILES: { bin: DayBin; label: string; icon: typeof CheckCircle2; tone: string }[] = [
  { bin: 'needs-submit', label: 'Needs my submission', icon: CheckCircle2, tone: 'text-blue-700 bg-blue-50' },
  { bin: 'awaiting-review', label: 'Awaiting my review', icon: FileSearch, tone: 'text-purple-700 bg-purple-50' },
  { bin: 'due-today', label: 'Due today', icon: CalendarClock, tone: 'text-amber-700 bg-amber-50' },
  { bin: 'overdue', label: 'Overdue', icon: AlertOctagon, tone: 'text-red-700 bg-red-50' },
  { bin: 'blocked', label: 'Blocked', icon: Pause, tone: 'text-rose-700 bg-rose-50' },
];

export function MyDayStrip({
  tasks,
  userId,
  activeFilter,
  view,
}: {
  tasks: Task[];
  userId: string;
  activeFilter?: string;
  view: string;
}) {
  const now = new Date();
  const counts: Record<DayBin, number> = {
    'needs-submit': 0,
    'awaiting-review': 0,
    'due-today': 0,
    overdue: 0,
    blocked: 0,
  };
  for (const t of tasks) {
    const b = binFor(t, userId, now);
    if (b) counts[b] += 1;
  }

  const allClear = counts['needs-submit'] === 0 && counts['awaiting-review'] === 0 && counts.overdue === 0;

  return (
    <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {TILES.map(({ bin, label, icon: Icon, tone }) => {
          const active = activeFilter === bin;
          return (
            <Link
              key={bin}
              href={`/tasks?view=${view}&filter=${bin}`}
              scroll={false}
              className={cn(
                'rounded-lg border p-3 flex items-center gap-3 transition',
                active ? 'border-primary ring-2 ring-primary/20 bg-primary-muted/40' : 'border-gray-100 hover:bg-gray-50'
              )}
            >
              <span className={cn('w-10 h-10 rounded-md flex items-center justify-center shrink-0', tone)}>
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={cn('text-2xl font-bold leading-none', counts[bin] === 0 ? 'text-gray-300' : 'text-gray-900')}>
                  {counts[bin]}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {allClear && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
          <Sparkles className="w-4 h-4" />
          You're all clear. Nice work. New tasks will surface here as they come in.
        </div>
      )}
    </div>
  );
}
