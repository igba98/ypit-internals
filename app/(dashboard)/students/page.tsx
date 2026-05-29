import { PageHeader } from '@/components/shared/PageHeader';
import { StudentsTable } from './_components/StudentsTable';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AddStudentButton } from './_components/AddStudentButton';
import { Student, PipelineStage } from '@/types';
import { backendFetch } from '@/lib/backend';

const STAGE_PILL: Record<
  PipelineStage,
  { label: string; cls: string; dot: string }
> = {
  LEAD:                  { label: 'Lead',                  cls: 'bg-gray-100 text-gray-700',       dot: 'bg-gray-400' },
  COUNSELING:            { label: 'Counseling',            cls: 'bg-blue-50 text-blue-700',        dot: 'bg-blue-500' },
  PAYMENT_PENDING:       { label: 'Payment Pending',       cls: 'bg-amber-50 text-amber-700',      dot: 'bg-amber-500' },
  PAYMENT_CONFIRMED:     { label: 'Payment Confirmed',     cls: 'bg-green-50 text-green-700',      dot: 'bg-green-500' },
  APPLICATION_SUBMITTED: { label: 'Application Submitted', cls: 'bg-indigo-50 text-indigo-700',    dot: 'bg-indigo-500' },
  UNIVERSITY_ACCEPTED:   { label: 'University Accepted',   cls: 'bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
  TRAVEL_PLANNING:       { label: 'Travel Planning',       cls: 'bg-purple-50 text-purple-700',    dot: 'bg-purple-500' },
  TRAVELLED:             { label: 'Travelled',             cls: 'bg-rose-50 text-rose-700',        dot: 'bg-rose-500' },
  MONITORING:            { label: 'Monitoring',            cls: 'bg-slate-100 text-slate-700',     dot: 'bg-slate-700' },
};

export default async function StudentsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value);

  const allowedRoles = [
    'MANAGING_DIRECTOR',
    'MARKETING_MANAGER',
    'FINANCE',
    'ADMISSIONS',
    'TRAVEL',
    'OPERATIONS',
    'MARKETING_STAFF',
    'SUB_AGENT',
  ];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');

  let students: Student[] = [];
  let fetchError: string | null = null;
  try {
    const params = new URLSearchParams({ limit: '200' });
    if (['MARKETING_STAFF', 'SUB_AGENT'].includes(session.role)) {
      params.set('assignedAgentId', session.userId);
    }
    const res = await backendFetch(`/students?${params.toString()}`);
    if (res.ok) {
      const body = await res.json();
      students = (body.items ?? []) as Student[];
    } else {
      fetchError = `Failed to load students (HTTP ${res.status})`;
    }
  } catch {
    fetchError = 'Unable to reach the backend.';
  }

  // Real stage counts derived from the live data.
  const counts: Partial<Record<PipelineStage, number>> = {};
  for (const s of students) {
    counts[s.pipelineStage] = (counts[s.pipelineStage] ?? 0) + 1;
  }
  const orderedStages = (Object.keys(STAGE_PILL) as PipelineStage[]).filter(
    (s) => counts[s],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage all student records and their pipeline status."
        actions={
          ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'MARKETING_STAFF', 'SUB_AGENT'].includes(
            session.role,
          ) && <AddStudentButton />
        }
      />

      {orderedStages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {orderedStages.map((stage) => {
            const cfg = STAGE_PILL[stage];
            return (
              <div
                key={stage}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${cfg.cls}`}
              >
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} /> {counts[stage]} {cfg.label}
              </div>
            );
          })}
        </div>
      )}

      {fetchError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {fetchError}
        </p>
      )}

      <StudentsTable data={students} userRole={session.role} />
    </div>
  );
}
