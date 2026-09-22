import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Avatar } from '@/components/shared/Avatar';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { PerformanceStrip, KPI_STEPS } from '@/components/performance/PerformanceStrip';
import { backendFetch } from '@/lib/backend';
import { isRO, pageAllowed } from '@/lib/permissions';
import { PerformanceReport, Session } from '@/types';

const ALLOWED = ['MARKETING_MANAGER', 'MARKETING_STAFF', 'TRAVEL', 'SUB_AGENT', 'MANAGING_DIRECTOR', 'IT_ADMIN'];

async function load(kind: 'RO' | 'SUB_AGENT', year?: string): Promise<PerformanceReport | null> {
  try {
    const q = new URLSearchParams({ kind });
    if (year && year !== 'all') q.set('year', year);
    const res = await backendFetch(`/reports/performance?${q}`);
    if (!res.ok) return null;
    return (await res.json()) as PerformanceReport;
  } catch {
    return null;
  }
}

/**
 * RO performance (system updates 2.0 §2) and sub-agent KPIs (§4). ROs and
 * sub-agents see only their own card - the backend enforces it.
 */
export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; year?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'leads', ALLOWED)) redirect('/dashboard');

  const params = await searchParams;
  const self = isRO(session.role) || session.role === 'SUB_AGENT';
  const kind: 'RO' | 'SUB_AGENT' =
    session.role === 'SUB_AGENT' || (!self && params.kind === 'SUB_AGENT') ? 'SUB_AGENT' : 'RO';
  const year = params.year ?? 'all';
  const data = await load(kind, year);
  const thisYear = new Date().getFullYear();
  const years = ['all', String(thisYear), String(thisYear - 1)];

  const href = (next: { kind?: string; year?: string }) => {
    const q = new URLSearchParams();
    const k = next.kind ?? kind;
    const y = next.year ?? year;
    if (k !== 'RO') q.set('kind', k);
    if (y !== 'all') q.set('year', y);
    return `/leads${q.toString() ? `?${q}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={self ? 'My Performance' : kind === 'RO' ? 'Relations Officer Performance' : 'Sub-agent KPIs'}
        description="Leads given → contacted → converted students → enrolled → travelled."
      />

      <div className="flex flex-wrap items-center gap-3">
        {!self && (
          <div className="flex rounded-md border border-gray-200 overflow-hidden">
            {(['RO', 'SUB_AGENT'] as const).map((k) => (
              <Link key={k} href={href({ kind: k })} className={`px-3 py-1.5 text-xs font-medium ${kind === k ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {k === 'RO' ? 'Relations Officers' : 'Sub-agents'}
              </Link>
            ))}
          </div>
        )}
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {years.map((y) => (
            <Link key={y} href={href({ year: y })} className={`px-3 py-1.5 text-xs font-medium ${year === y ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {y === 'all' ? 'All time' : y}
            </Link>
          ))}
        </div>
      </div>

      {!data && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">Unable to load performance data.</p>
      )}

      {data && self && (
        data.rows[0] ? (
          <PerformanceStrip row={data.rows[0]} subtitle={year === 'all' ? 'All time' : `Intake ${year}`} />
        ) : (
          <p className="text-sm text-gray-500">No performance recorded yet.</p>
        )
      )}

      {data && !self && (
        <>
          <PerformanceStrip
            row={data.totals}
            title={kind === 'RO' ? 'All Relations Officers' : 'All sub-agents'}
            subtitle={`${data.totals.people} ${kind === 'RO' ? 'officers' : 'agents'} · ${year === 'all' ? 'all time' : year}`}
          />
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-medium">{kind === 'RO' ? 'Relations Officer' : 'Sub-agent'}</th>
                    {KPI_STEPS.map((k) => (
                      <th key={k.key} className="px-4 py-3 font-medium text-right" title={k.hint}>{k.label}</th>
                    ))}
                    <th className="px-4 py-3 font-medium text-right">Lead → student</th>
                    {kind === 'SUB_AGENT' && <th className="px-4 py-3 font-medium text-right">vs target</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.name} size="md" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {kind === 'SUB_AGENT' ? <Link href={`/subagents/${r.id}`} className="hover:text-primary">{r.name}</Link> : r.name}
                            </p>
                            {kind === 'RO' ? <RoleBadge role={r.role} className="scale-90 origin-left" /> : r.agentCode && <p className="text-[11px] text-gray-500 font-mono">{r.agentCode}</p>}
                          </div>
                        </div>
                      </td>
                      {KPI_STEPS.map((k) => (
                        <td key={k.key} className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{r[k.key]}</td>
                      ))}
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600">{r.conversionRate}%</td>
                      {kind === 'SUB_AGENT' && (
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                          {r.targetProgressPct === null ? '-' : `${r.converted}/${r.studentTarget} (${r.targetProgressPct}%)`}
                        </td>
                      )}
                    </tr>
                  ))}
                  {data.rows.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No {kind === 'RO' ? 'Relations Officers' : 'sub-agents'} yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
