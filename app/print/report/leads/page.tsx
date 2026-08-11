import { backendFetch } from '@/lib/backend';
import { LeadsAnalytics } from '@/types';
import { formatDate } from '@/lib/utils';
import { AGENCY_INFO } from '@/lib/agency-info';
import { PrintButton } from '../../invoice/[id]/_components/PrintButton';

export const metadata = {
  title: 'Leads & Admissions Report · YPIT',
};

async function load(year: number): Promise<LeadsAnalytics | null> {
  try {
    const res = await backendFetch(`/reports/leads-analytics?year=${year}`);
    if (!res.ok) return null;
    return (await res.json()) as LeadsAnalytics;
  } catch {
    return null;
  }
}

function label(key: string): string {
  return key.replace(/_/g, ' ').toLowerCase();
}

export default async function LeadsReportPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();
  /** Optional single-month focus, e.g. "3" for March. */
  const monthFocus = Number(params.month) || 0;

  const data = await load(year);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Could not load report data for {year}.
      </div>
    );
  }

  const months =
    monthFocus >= 1 && monthFocus <= 12
      ? data.months.filter((_, i) => i === monthFocus - 1)
      : data.months;
  const periodLabel =
    monthFocus >= 1 && monthFocus <= 12
      ? `${data.months[monthFocus - 1].label} ${year}`
      : `Year ${year}`;

  // Scale the inline bars to the busiest month in view.
  const peak = Math.max(1, ...months.map((m) => m.leads));

  const shown = {
    leads: months.reduce((s, m) => s + m.leads, 0),
    converted: months.reduce((s, m) => s + m.converted, 0),
    students: months.reduce((s, m) => s + m.students, 0),
    enquiries: months.reduce((s, m) => s + m.enquiries, 0),
  };
  const shownRate =
    shown.leads > 0 ? Math.round((shown.converted / shown.leads) * 1000) / 10 : 0;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[980px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Leads &amp; Admissions Report
            </p>
            <p className="text-sm text-gray-700">{periodLabel}</p>
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Leads &amp; Admissions
              </p>
              <p className="text-sm font-bold text-gray-900 mt-1">{periodLabel}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Generated {formatDate(data.generatedAt)}
              </p>
            </div>
          </header>

          {/* ── Headline numbers ── */}
          <section className="grid grid-cols-5 gap-4 mt-5 text-xs">
            <div>
              <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Leads</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{shown.leads}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Converted</p>
              <p className="text-lg font-bold text-green-700 mt-0.5">{shown.converted}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Conversion</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{shownRate}%</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Students</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{shown.students}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Web enquiries</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{shown.enquiries}</p>
            </div>
          </section>

          {/* ── Best month callout (the client's headline question) ── */}
          {!monthFocus && data.bestMonth && (
            <section className="mt-5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Best performing month
              </p>
              <p className="text-sm text-gray-900 mt-1">
                <b>{data.bestMonth.label} {year}</b> brought the most leads —{' '}
                <b>{data.bestMonth.leads}</b> lead{data.bestMonth.leads === 1 ? '' : 's'}
                {data.bestMonth.students > 0 && (
                  <> and {data.bestMonth.students} student registration{data.bestMonth.students === 1 ? '' : 's'}</>
                )}
                .
                {data.bestStudentMonth &&
                  data.bestStudentMonth.label !== data.bestMonth.label &&
                  data.bestStudentMonth.students > 0 && (
                    <>
                      {' '}Most student registrations came in{' '}
                      <b>{data.bestStudentMonth.label}</b> ({data.bestStudentMonth.students}).
                    </>
                  )}
              </p>
              <p className="text-[11px] text-gray-600 mt-1">
                Average {data.totals.monthlyAverage} leads per month across {year}.
              </p>
            </section>
          )}

          {/* ── Month-by-month ── */}
          <section className="mt-6">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Month by month</h2>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2 font-medium border-b border-gray-200">Month</th>
                  <th className="px-3 py-2 font-medium border-b border-gray-200 text-right">Leads</th>
                  <th className="px-3 py-2 font-medium border-b border-gray-200 text-right">Converted</th>
                  <th className="px-3 py-2 font-medium border-b border-gray-200 text-right">Students</th>
                  <th className="px-3 py-2 font-medium border-b border-gray-200 text-right">Enquiries</th>
                  <th className="px-3 py-2 font-medium border-b border-gray-200">Volume</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => {
                  const isBest = data.bestMonth?.label === m.label && !monthFocus;
                  return (
                    <tr key={m.key} className={isBest ? 'bg-primary/5' : ''}>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-gray-900">
                        {m.label}
                        {isBest && (
                          <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                            best
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-right font-semibold text-gray-900">{m.leads}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-right text-green-700">{m.converted}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-right text-gray-700">{m.students}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-right text-gray-700">{m.enquiries}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100">
                        <div className="h-2 bg-gray-100 rounded-sm w-full">
                          <div
                            className="h-2 bg-primary rounded-sm"
                            style={{ width: `${Math.round((m.leads / peak) * 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold text-gray-900 bg-gray-50">
                  <td className="px-3 py-2 border-t-2 border-gray-200">Total</td>
                  <td className="px-3 py-2 border-t-2 border-gray-200 text-right">{shown.leads}</td>
                  <td className="px-3 py-2 border-t-2 border-gray-200 text-right text-green-700">{shown.converted}</td>
                  <td className="px-3 py-2 border-t-2 border-gray-200 text-right">{shown.students}</td>
                  <td className="px-3 py-2 border-t-2 border-gray-200 text-right">{shown.enquiries}</td>
                  <td className="px-3 py-2 border-t-2 border-gray-200" />
                </tr>
              </tfoot>
            </table>
          </section>

          {/* ── Breakdowns ── */}
          <section className="mt-6 grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-2">Where leads came from</h2>
              {data.sources.length === 0 ? (
                <p className="text-xs text-gray-500">No leads recorded in {year}.</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody>
                    {data.sources.map((s) => (
                      <tr key={s.key}>
                        <td className="py-1 text-gray-700 capitalize">{label(s.key)}</td>
                        <td className="py-1 text-right font-semibold text-gray-900">{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-2">Lead status</h2>
              {data.statuses.length === 0 ? (
                <p className="text-xs text-gray-500">—</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody>
                    {data.statuses.map((s) => (
                      <tr key={s.key}>
                        <td className="py-1 text-gray-700 capitalize">{label(s.key)}</td>
                        <td className="py-1 text-right font-semibold text-gray-900">{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ── Team productivity ── */}
          {data.agents.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2">By owner</h2>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="px-3 py-2 font-medium border-b border-gray-200">Owner</th>
                    <th className="px-3 py-2 font-medium border-b border-gray-200 text-right">Leads</th>
                    <th className="px-3 py-2 font-medium border-b border-gray-200 text-right">Converted</th>
                    <th className="px-3 py-2 font-medium border-b border-gray-200 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agents.map((a) => (
                    <tr key={a.name}>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-gray-900">{a.name}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-right">{a.leads}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-right text-green-700">{a.converted}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-right">{a.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* ── Destinations ── */}
          {data.destinations.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Student destinations</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                {data.destinations.map((d) => (
                  <span key={d.key} className="text-gray-700">
                    {d.key} <b className="text-gray-900">{d.count}</b>
                  </span>
                ))}
              </div>
            </section>
          )}

          <footer className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between">
            <span>
              {AGENCY_INFO.name} · {AGENCY_INFO.phone} · {AGENCY_INFO.email}
            </span>
            <span>Figures are drawn live from the system on {formatDate(data.generatedAt)}.</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
