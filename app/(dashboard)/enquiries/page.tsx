import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { Session, WebsiteEnquiry } from '@/types';
import { Inbox, MessageSquare, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { EnquiryRow } from './_components/EnquiryRow';

interface EnquiriesResponse {
  items: WebsiteEnquiry[];
  newCount: number;
}

async function load(filter?: string): Promise<{ items: WebsiteEnquiry[]; newCount: number; error: string | null }> {
  try {
    const qs = filter && filter !== 'all' ? `?status=${filter}` : '';
    const res = await backendFetch(`/enquiries${qs}`);
    if (!res.ok) return { items: [], newCount: 0, error: `Failed to load enquiries (HTTP ${res.status})` };
    const body = (await res.json()) as EnquiriesResponse;
    return { items: body.items ?? [], newCount: body.newCount ?? 0, error: null };
  } catch {
    return { items: [], newCount: 0, error: 'Unable to reach the backend.' };
  }
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'CONVERTED', label: 'Converted' },
  { key: 'ARCHIVED', label: 'Archived' },
];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const allowed = ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'MARKETING_STAFF', 'IT_ADMIN'];
  if (!allowed.includes(session.role)) redirect('/dashboard');

  const { status = 'all' } = await searchParams;
  const { items, newCount, error } = await load(status);

  const bookings = items.filter((e) => e.type === 'BOOKING').length;
  const converted = items.filter((e) => e.status === 'CONVERTED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Enquiries"
        description="Submissions from the public site — contact messages and booking requests."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="New (unactioned)" value={newCount} icon={Inbox} />
        <KPICard label="Showing" value={items.length} icon={MessageSquare} />
        <KPICard label="Bookings" value={bookings} icon={CalendarCheck} />
        <KPICard label="Converted to Leads" value={converted} icon={CheckCircle2} />
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/enquiries?status=${t.key}`}
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
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Topic / Contact</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((e) => (
                <EnquiryRow key={e.id} enquiry={e} />
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No enquiries{status !== 'all' ? ` with status ${status.toLowerCase()}` : ''} yet.
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
