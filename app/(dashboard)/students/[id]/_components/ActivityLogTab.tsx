import { formatDate, formatRelativeTime } from '@/lib/utils';
import { ActivityEvent, ActivityKind } from '@/lib/studentDetail';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  FileText,
  Upload,
  ShieldCheck,
  Plane,
  StickyNote,
  Activity,
} from 'lucide-react';

interface ActivityLogTabProps {
  events: ActivityEvent[];
}

const KIND_META: Record<ActivityKind, { icon: React.ElementType; ring: string; bg: string; text: string }> = {
  CREATED: { icon: Sparkles, ring: 'ring-primary/20', bg: 'bg-primary text-white', text: 'text-primary' },
  STAGE: { icon: TrendingUp, ring: 'ring-blue-100', bg: 'bg-blue-500 text-white', text: 'text-blue-700' },
  PAYMENT: { icon: DollarSign, ring: 'ring-green-100', bg: 'bg-green-500 text-white', text: 'text-green-700' },
  APPLICATION: { icon: FileText, ring: 'ring-purple-100', bg: 'bg-purple-500 text-white', text: 'text-purple-700' },
  DOCUMENT: { icon: Upload, ring: 'ring-indigo-100', bg: 'bg-indigo-500 text-white', text: 'text-indigo-700' },
  VISA: { icon: ShieldCheck, ring: 'ring-amber-100', bg: 'bg-amber-500 text-white', text: 'text-amber-700' },
  TRAVEL: { icon: Plane, ring: 'ring-primary/20', bg: 'bg-primary text-white', text: 'text-primary' },
  NOTE: { icon: StickyNote, ring: 'ring-gray-200', bg: 'bg-gray-500 text-white', text: 'text-gray-700' },
};

export function ActivityLogTab({ events }: ActivityLogTabProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Activity className="w-7 h-7 text-gray-400" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">No activity yet</h4>
        <p className="text-xs text-gray-500 mt-1">Events for this student will appear here as the team works through the pipeline.</p>
      </div>
    );
  }

  // Group events by date (yyyy-mm-dd)
  const groups: Record<string, ActivityEvent[]> = {};
  for (const e of events) {
    const day = new Date(e.timestamp).toISOString().slice(0, 10);
    (groups[day] ??= []).push(e);
  }
  const dayKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Activity Timeline
        </h3>
        <p className="text-xs text-gray-500">{events.length} events</p>
      </div>

      <div className="relative">
        {/* Vertical rail */}
        <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-gray-200 to-transparent" />

        <div className="space-y-6">
          {dayKeys.map(day => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-3 ml-12">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {formatDate(day)}
                </span>
                <span className="text-[11px] text-gray-400">· {groups[day].length} event{groups[day].length === 1 ? '' : 's'}</span>
              </div>

              <ul className="space-y-3">
                {groups[day].map(event => {
                  const meta = KIND_META[event.kind];
                  const Icon = meta.icon;
                  return (
                    <li key={event.id} className="relative pl-12">
                      <span className={`absolute left-0 top-0.5 w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center ring-4 ring-white shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </span>

                      <div className="rounded-lg border border-gray-100 bg-white p-3.5 hover:shadow-card transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                          <span className={`text-[11px] font-medium shrink-0 ${meta.text}`} title={new Date(event.timestamp).toLocaleString()}>
                            {formatRelativeTime(event.timestamp)}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{event.description}</p>
                        )}
                        {event.actor && (
                          <p className="text-[11px] text-gray-400 mt-2">by {event.actor}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
