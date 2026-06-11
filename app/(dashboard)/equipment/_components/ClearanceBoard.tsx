import { StaffClearance } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { BadgeCheck, CircleAlert } from 'lucide-react';

export function ClearanceBoard({ board }: { board: StaffClearance[] }) {
  if (board.length === 0) return null;

  return (
    <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Staff Clearance</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          A leaver is cleared when every issued item is returned. Lost items stay on record.
        </p>
      </div>
      <ul className="divide-y divide-gray-100">
        {board.map((b) => (
          <li key={b.staffId} className="px-5 py-3.5 flex items-center gap-3">
            <Avatar name={b.staffName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{b.staffName}</p>
              <p className="text-[11px] text-gray-500">
                {b.totalIssued} item{b.totalIssued === 1 ? '' : 's'} issued
                {b.lostCount > 0 && <span className="text-red-600"> · {b.lostCount} lost</span>}
              </p>
            </div>
            {b.cleared ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                <BadgeCheck className="w-3.5 h-3.5" /> CLEARED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                <CircleAlert className="w-3.5 h-3.5" /> {b.outstandingCount} outstanding
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
