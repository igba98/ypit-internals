import { PerformanceRow } from '@/types';

/** The five RO / sub-agent KPIs from the client brief, as a funnel. */
export const KPI_STEPS: { key: keyof Pick<PerformanceRow, 'leadsGiven' | 'contacted' | 'converted' | 'enrolled' | 'travelled'>; label: string; hint: string }[] = [
  { key: 'leadsGiven', label: 'Leads given', hint: 'Leads assigned to them' },
  { key: 'contacted', label: 'Contacted', hint: 'Leads moved past New' },
  { key: 'converted', label: 'Converted students', hint: 'Students credited to them' },
  { key: 'enrolled', label: 'Enrolled', hint: 'Accepted by a university or further' },
  { key: 'travelled', label: 'Travelled', hint: 'Travelled or in monitoring' },
];

export function PerformanceStrip({
  row,
  title = 'My performance',
  subtitle,
}: {
  row: Pick<PerformanceRow, 'leadsGiven' | 'contacted' | 'converted' | 'enrolled' | 'travelled'>;
  title?: string;
  subtitle?: string;
}) {
  const top = Math.max(1, row.leadsGiven, row.converted);
  return (
    <section className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {KPI_STEPS.map((k, i) => {
          const v = row[k.key];
          const prev = i > 0 ? row[KPI_STEPS[i - 1].key] : null;
          const rate = prev && prev > 0 && i > 0 ? Math.round((v / prev) * 100) : null;
          return (
            <div key={k.key} className="rounded-lg border border-gray-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500" title={k.hint}>{k.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{v}</p>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-1.5 bg-primary rounded-full" style={{ width: `${Math.round((v / top) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 h-3">{rate !== null ? `${rate}% of previous step` : ''}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
