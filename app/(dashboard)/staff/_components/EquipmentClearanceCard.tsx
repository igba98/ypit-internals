import Link from 'next/link';
import { backendFetch } from '@/lib/backend';
import { StaffClearance } from '@/types';
import { formatDate } from '@/lib/utils';
import { BadgeCheck, CircleAlert, Laptop } from 'lucide-react';

async function loadClearance(staffId: string): Promise<StaffClearance | null> {
  try {
    const res = await backendFetch(`/equipment/clearance/${staffId}`);
    if (!res.ok) return null;
    return (await res.json()) as StaffClearance;
  } catch {
    return null;
  }
}

/** Server component — drop into the staff detail page. */
export async function EquipmentClearanceCard({ staffId }: { staffId: string }) {
  const clearance = await loadClearance(staffId);
  if (!clearance || clearance.totalIssued === 0) return null;

  return (
    <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Laptop className="w-4 h-4" /> Equipment Clearance
        </h3>
        {clearance.cleared ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
            <BadgeCheck className="w-3.5 h-3.5" /> CLEARED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
            <CircleAlert className="w-3.5 h-3.5" /> {clearance.outstandingCount} outstanding
          </span>
        )}
      </div>

      {clearance.cleared ? (
        <p className="text-sm text-gray-600 px-5 py-4">
          All {clearance.totalIssued} issued item{clearance.totalIssued === 1 ? '' : 's'} returned.
          {clearance.lostCount > 0 && (
            <span className="text-red-600"> ({clearance.lostCount} recorded as lost.)</span>
          )}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {(clearance.outstanding ?? []).map((e) => (
            <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                <p className="text-[11px] text-gray-500 font-mono">
                  {e.assetNumber} · issued {formatDate(e.issuedAt)}
                </p>
              </div>
              <span className="text-[11px] uppercase tracking-wider text-gray-500 shrink-0">
                {e.category.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
        <Link href="/equipment" className="text-xs font-medium text-primary hover:underline">
          Manage in Equipment Register →
        </Link>
      </div>
    </section>
  );
}
