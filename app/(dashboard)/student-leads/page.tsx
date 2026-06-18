import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { Lead, LeadSource } from '@/types';
import { formatDate } from '@/lib/utils';
import { GraduationCap, UserPlus, CheckCircle2, Mail, Phone } from 'lucide-react';
import { AddStudentLeadButton } from './_components/AddStudentLeadButton';

const ALLOWED = [
  'SUB_AGENT',
  'MARKETING_MANAGER',
  'MARKETING_STAFF',
  'MANAGING_DIRECTOR',
];

interface LeadsResponse {
  items: (Lead & { createdById?: string })[];
}

async function load(
  status?: string,
): Promise<{ items: (Lead & { createdById?: string })[]; error: string | null }> {
  try {
    const params = new URLSearchParams({ limit: '500' });
    if (status && status !== 'all') params.set('status', status);
    const res = await backendFetch(`/leads?${params.toString()}`);
    if (!res.ok)
      return { items: [], error: `Failed to load leads (HTTP ${res.status}).` };
    const body = (await res.json()) as LeadsResponse;
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'COUNSELED', label: 'Counseled' },
  { key: 'CONVERTED', label: 'Converted' },
  { key: 'LOST', label: 'Lost' },
];

const STATUS_BADGE: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  COUNSELED: 'bg-indigo-100 text-indigo-800',
  CONVERTED: 'bg-green-100 text-green-800',
  LOST: 'bg-gray-100 text-gray-600',
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  SOCIAL_MEDIA: 'Social Media',
  SCHOOL_VISIT: 'School Visit',
  SUB_AGENT: 'Sub Agent',
  REFERRAL: 'Referral',
  WALK_IN: 'Walk In',
  WEBSITE: 'Website',
};

export default async function StudentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as {
    role: string;
    userId: string;
  };
  if (!ALLOWED.includes(session.role)) redirect('/dashboard');

  const { status = 'all' } = await searchParams;
  const { items, error } = await load(status);

  // Sub-agents only see the leads they own.
  const visible =
    session.role === 'SUB_AGENT'
      ? items.filter(
          (l) =>
            l.assignedToId === session.userId ||
            l.createdById === session.userId,
        )
      : items;

  const converted = visible.filter((l) => l.status === 'CONVERTED').length;
  const open = visible.filter(
    (l) => l.status !== 'CONVERTED' && l.status !== 'LOST',
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Leads"
        description="Capture prospective students and track them through the leads pipeline."
        actions={<AddStudentLeadButton />}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Total Leads" value={visible.length} icon={GraduationCap} />
        <KPICard label="Open" value={open} icon={UserPlus} />
        <KPICard label="Converted" value={converted} icon={CheckCircle2} />
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <Link
              key={t.key}
              href={t.key === 'all' ? '/student-leads' : `/student-leads?status=${t.key}`}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                status === t.key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Interested In</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-gray-900">{l.fullName}</p>
                    {l.nationality && (
                      <p className="text-[11px] text-gray-500">{l.nationality}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {l.phone}
                      </span>
                      {l.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {l.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-900">{l.interestedIn}</p>
                    {l.interestedCountry && (
                      <p className="text-[11px] text-gray-500">{l.interestedCountry}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">
                    {SOURCE_LABEL[l.source]}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">
                    {l.assignedToName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(l.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_BADGE[l.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No student leads{status !== 'all' ? ` with status ${status.toLowerCase()}` : ''} yet.
                    Use “Add Student Lead” to capture one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
