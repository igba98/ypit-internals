import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { canEdit, pageAllowed } from '@/lib/permissions';
import { Session } from '@/types';
import { CheckCircle2, Clock, FileCheck2, XCircle } from 'lucide-react';
import { DocumentsQueue, QueueDoc } from './_components/DocumentsQueue';

const READ = ['ADMISSIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'TRAVEL', 'FINANCE'];
const VERIFY = ['ADMISSIONS', 'MANAGING_DIRECTOR'];

async function load(status: string): Promise<{ items: QueueDoc[]; counts: Record<string, number> }> {
  const counts: Record<string, number> = {};
  try {
    const [list, ...totals] = await Promise.all([
      backendFetch(`/documents?limit=500${status !== 'ALL' ? `&status=${status}` : ''}`),
      ...(['PENDING_REVIEW', 'VERIFIED', 'REJECTED'] as const).map((s) => backendFetch(`/documents?limit=1&status=${s}`)),
    ]);
    for (const [i, s] of (['PENDING_REVIEW', 'VERIFIED', 'REJECTED'] as const).entries()) {
      counts[s] = totals[i].ok ? ((await totals[i].json()) as { total: number }).total : 0;
    }
    const items = list.ok ? (((await list.json()) as { items: QueueDoc[] }).items ?? []) : [];
    return { items, counts };
  } catch {
    return { items: [], counts };
  }
}

/** Admissions: every student's uploaded documents in one review queue (system updates 2.0 §6). */
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'documents', READ)) redirect('/dashboard');

  const { status: raw } = await searchParams;
  const status = ['PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'ALL'].includes(raw ?? '') ? raw! : 'PENDING_REVIEW';
  const { items, counts } = await load(status);

  return (
    <div className="space-y-6">
      <PageHeader title="Student Documents" description="Review, verify or reject what students and officers upload - passports, transcripts, certificates and more." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Awaiting review" value={counts.PENDING_REVIEW ?? 0} icon={Clock} />
        <KPICard label="Verified" value={counts.VERIFIED ?? 0} icon={CheckCircle2} />
        <KPICard label="Rejected" value={counts.REJECTED ?? 0} icon={XCircle} />
        <KPICard label="Showing" value={items.length} icon={FileCheck2} />
      </div>
      <DocumentsQueue items={items} status={status} canVerify={canEdit(session, 'documents', VERIFY)} />
    </div>
  );
}
