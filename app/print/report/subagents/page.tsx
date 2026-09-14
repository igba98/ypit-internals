import { backendFetch } from '@/lib/backend';
import { SubagentReport } from '@/types';
import { formatDate } from '@/lib/utils';
import { AGENCY_INFO } from '@/lib/agency-info';
import { PrintButton } from '../../invoice/[id]/_components/PrintButton';

export const metadata = { title: 'Sub-agent Performance · YPIT' };

async function load(year: number): Promise<SubagentReport | null> {
  try {
    const res = await backendFetch(`/reports/subagents?year=${year}`);
    if (!res.ok) return null;
    return (await res.json()) as SubagentReport;
  } catch {
    return null;
  }
}

export default async function SubagentReportPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();
  const data = await load(year);
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Could not load report data for {year}.</div>;
  }
  const peak = Math.max(1, ...data.agents.map((a) => a.students));

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[980px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Sub-agent Performance</p>
            <p className="text-sm text-gray-700">Year {year}</p>
          </div>
          <PrintButton />
        </div>

        <article className="bg-white shadow-md print:shadow-none border border-gray-200 print:border-0 rounded-lg print:rounded-none p-10 print:p-8">
          <header className="flex items-start justify-between gap-8 pb-5 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{AGENCY_INFO.name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{AGENCY_INFO.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Sub-agent Performance Report</p>
              <p className="text-sm font-bold text-gray-900 mt-1">Year {year}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Generated {formatDate(data.generatedAt)}</p>
            </div>
          </header>

          <section className="grid grid-cols-5 gap-4 py-6 border-b border-gray-200">
            <Stat label="Sub-agents" value={data.totals.agents} />
            <Stat label="Active contracts" value={data.totals.activeContracts} />
            <Stat label="Leads" value={data.totals.leads} />
            <Stat label="Students recruited" value={data.totals.students} />
            <Stat label="Travelled" value={data.totals.travelled} />
          </section>

          {data.topAgent && (
            <p className="mt-5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
              <span className="font-semibold">Top performer:</span> {data.topAgent.name} with {data.topAgent.students} student{data.topAgent.students === 1 ? '' : 's'} recruited in {year}.
            </p>
          )}

          <section className="mt-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Performance by sub-agent</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="text-left py-2 font-medium">Sub-agent</th>
                  <th className="text-left py-2 font-medium">Contract</th>
                  <th className="text-right py-2 font-medium">Target</th>
                  <th className="text-right py-2 font-medium">Leads</th>
                  <th className="text-right py-2 font-medium">Students</th>
                  <th className="text-right py-2 font-medium">Travelled</th>
                  <th className="text-right py-2 font-medium">Progress</th>
                  <th className="py-2 w-[22%]"></th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 align-top">
                    <td className="py-2">
                      <p className="font-medium text-gray-900">{a.name}</p>
                      <p className="text-[11px] text-gray-500">{a.phone ?? a.email}</p>
                      {a.commissionTerms && <p className="text-[11px] text-gray-500">Commission: {a.commissionTerms}</p>}
                    </td>
                    <td className="py-2 text-xs text-gray-700">
                      {a.contractStatus ? a.contractStatus.toLowerCase() : <span className="text-gray-400">none</span>}
                      {a.contractEnd && <p className="text-[11px] text-gray-500">to {formatDate(a.contractEnd)}</p>}
                    </td>
                    <td className="py-2 text-right text-gray-600">{a.studentTarget || '-'}</td>
                    <td className="py-2 text-right">{a.leads}<span className="text-gray-400 text-[11px]"> ({a.leadsConverted} conv.)</span></td>
                    <td className="py-2 text-right font-semibold">{a.students}</td>
                    <td className="py-2 text-right text-gray-600">{a.travelled}</td>
                    <td className="py-2 text-right text-gray-600">{a.progressPct === null ? '-' : `${a.progressPct}%`}</td>
                    <td className="py-2 pl-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                        <div className="h-2 bg-gray-800 rounded-full" style={{ width: `${Math.round((a.students / peak) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
                {data.agents.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-gray-500">No sub-agents registered.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Sub-agent recruitment by month</h2>
            <div className="grid grid-cols-12 gap-1 items-end h-24">
              {data.months.map((m) => {
                const mp = Math.max(1, ...data.months.map((x) => x.students));
                return (
                  <div key={m.key} className="flex flex-col items-center justify-end h-full">
                    <span className="text-[10px] text-gray-700 mb-0.5">{m.students || ''}</span>
                    <div className="w-full bg-gray-800 rounded-t" style={{ height: `${Math.max(2, Math.round((m.students / mp) * 80))}%` }} />
                    <span className="text-[10px] text-gray-500 mt-1">{m.short}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="mt-10 pt-4 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between">
            <span>{AGENCY_INFO.name} · {AGENCY_INFO.address.join(", ")}</span>
            <span>Confidential - internal use</span>
          </footer>
        </article>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
