import { CheckIn, WellbeingStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Activity } from 'lucide-react';

const WELLBEING_COLORS: Record<WellbeingStatus, string> = {
  GOOD: 'bg-green-100 text-green-800',
  NEEDS_ATTENTION: 'bg-yellow-100 text-yellow-800',
  ESCALATED: 'bg-red-100 text-red-800',
};

interface Props {
  checkIns: CheckIn[];
}

export function CheckInHistory({ checkIns }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Activity className="w-4 h-4" /> Check-in History
        </h3>
        <span className="text-xs text-gray-500">
          {checkIns.length} entr{checkIns.length === 1 ? 'y' : 'ies'}
        </span>
      </div>
      {checkIns.length === 0 ? (
        <p className="text-sm text-gray-500 px-5 py-8 text-center">
          No check-ins yet. Use the form above to record the first one.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {checkIns.map((c) => (
            <li key={c.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span
                  className={`text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${WELLBEING_COLORS[c.wellbeingStatus]}`}
                >
                  {c.wellbeingStatus === 'ESCALATED' && <AlertTriangle className="w-3 h-3" />}
                  {c.wellbeingStatus.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-gray-500">
                  {formatDate(c.createdAt)} · by {c.submittedByName}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.notes}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
