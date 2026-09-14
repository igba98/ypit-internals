import { backendFetch } from '@/lib/backend';
import { RecruitmentReport } from '@/types';
import { formatDate } from '@/lib/utils';
import { AGENCY_INFO } from '@/lib/agency-info';
import { PrintButton } from '../../invoice/[id]/_components/PrintButton';

export const metadata = { title: 'Recruitment by Country · YPIT' };

async function load(year: number): Promise<RecruitmentReport | null> {
  try {
    const res = await backendFetch(`/reports/recruitment-by-country?year=${year}`);
    if (!res.ok) return null;
    return (await res.json()) as RecruitmentReport;
  } catch {
    return null;
  }
}

export default async function RecruitmentReportPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();
  const monthFocus = Number(params.month) || 0;
  const data = await load(year);
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Could not load report data for {year}.</div>;
  }

  const inFocus = monthFocus >= 1 && monthFocus <= 12;
  const periodLabel = inFocus ? `${data.months[monthFocus - 1].label} ${year}` : `Year ${year}`;
  // Month focus: re-rank countries by that month's intake only.
  const countries = (inFocus
    ? data.countries.map((c) => ({ ...c, students: c.byMonth[monthFocus - 1] }))
    : data.countries
  ).filter((c) => c.students > 0 || c.leads > 0).sort((a, b) => b.students - a.students || b.leads - a.leads);
  const months = inFocus ? data.months.filter((_, i) => i === monthFocus - 1) : data.months;
  const totalStudents = countries.reduce((s, c) => s + c.students, 0);
  const peak = Math.max(1, ...countries.map((c) => c.students));
  const monthPeak = Math.max(1, ...months.map((m) => m.students));

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[980px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Recruitment by African Country</p>
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Student Recruitment by Country</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{periodLabel}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Generated {formatDate(data.generatedAt)}</p>
            </div>
          </header>

          <section className="grid grid-cols-4 gap-4 py-6 border-b border-gray-200">
            <Stat label="Students recruited" value={totalStudents} />
            <Stat label="Countries represented" value={countries.filter((c) => c.country !== 'Unspecified').length} />
            <Stat label="Leads" value={inFocus ? months[0].leads : data.totals.leads} />
            <Stat label="BD activities" value={data.totals.events} />
          </section>

          {data.topCountry && !inFocus && (
            <p className="mt-5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
              <span className="font-semibold">Top recruitment country:</span> {data.topCountry.country} with {data.topCountry.students} student{data.topCountry.students === 1 ? '' : 's'} in {year}.
              {data.totals.unspecified > 0 && <span className="text-gray-500"> {data.totals.unspecified} student{data.totals.unspecified === 1 ? '' : 's'} without a recorded country of origin.</span>}
            </p>
          )}

          <section className="mt-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Students by country of origin</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="text-left py-2 font-medium">Country</th>
                  <th className="text-right py-2 font-medium">Students</th>
                  <th className="text-right py-2 font-medium">Travelled</th>
                  <th className="text-right py-2 font-medium">Leads</th>
                  <th className="text-right py-2 font-medium">Converted</th>
                  <th className="py-2 w-[30%]"></th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.country} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900">{c.country}</td>
                    <td className="py-2 text-right">{c.students}</td>
                    <td className="py-2 text-right text-gray-600">{c.travelled}</td>
                    <td className="py-2 text-right text-gray-600">{c.leads}</td>
                    <td className="py-2 text-right text-gray-600">{c.leadsConverted}</td>
                    <td className="py-2 pl-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-800 rounded-full" style={{ width: `${Math.round((c.students / peak) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
                {countries.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-500">No recruitment recorded for this period.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          {!inFocus && (
            <section className="mt-8">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Monthly intake</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <th className="text-left py-2 font-medium">Month</th>
                    <th className="text-right py-2 font-medium">Students</th>
                    <th className="text-right py-2 font-medium">Leads</th>
                    <th className="py-2 w-[40%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.key} className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-900">{m.label}</td>
                      <td className="py-1.5 text-right">{m.students}</td>
                      <td className="py-1.5 text-right text-gray-600">{m.leads}</td>
                      <td className="py-1.5 pl-3">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 bg-gray-800 rounded-full" style={{ width: `${Math.round((m.students / monthPeak) * 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {data.activities.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Recruitment activities by country</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <th className="text-left py-2 font-medium">Country</th>
                    <th className="text-right py-2 font-medium">Events / visits</th>
                    <th className="text-right py-2 font-medium">Leads generated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activities.map((a) => (
                    <tr key={a.country} className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-900">{a.country}</td>
                      <td className="py-1.5 text-right">{a.events}</td>
                      <td className="py-1.5 text-right text-gray-600">{a.leadsGenerated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

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
