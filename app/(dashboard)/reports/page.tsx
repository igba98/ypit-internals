import { PageHeader } from '@/components/shared/PageHeader';
import { ReportsDashboard } from './_components/ReportsDashboard';
import { ExportReportButton } from './_components/ExportReportButton';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { backendFetch } from '@/lib/backend';
import { ReportsOverview, Session } from '@/types';

async function loadOverview(): Promise<{ data: ReportsOverview | null; error: string | null }> {
  try {
    const res = await backendFetch('/reports/overview');
    if (!res.ok) return { data: null, error: `Failed to load reports (HTTP ${res.status})` };
    return { data: (await res.json()) as ReportsOverview, error: null };
  } catch {
    return { data: null, error: 'Unable to reach the backend.' };
  }
}

export default async function ReportsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const { data, error } = await loadOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Live business performance, computed from system data."
        actions={<ExportReportButton />}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      {data && <ReportsDashboard data={data} role={session.role} />}
    </div>
  );
}
