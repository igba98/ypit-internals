import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { Session, ContactGroup, Campaign } from '@/types';
import { Users, Send, Megaphone, CheckCircle2 } from 'lucide-react';
import { ImportPanel } from './_components/ImportPanel';
import { ComposePanel } from './_components/ComposePanel';
import { GroupsList } from './_components/GroupsList';
import { HistoryTable } from './_components/HistoryTable';

const ALLOWED = ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'MARKETING_STAFF'];

async function loadGroups(): Promise<ContactGroup[]> {
  try {
    const res = await backendFetch('/campaigns/groups');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: ContactGroup[] };
    return body.items ?? [];
  } catch {
    return [];
  }
}

async function loadCampaigns(): Promise<Campaign[]> {
  try {
    const res = await backendFetch('/campaigns');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: Campaign[] };
    return body.items ?? [];
  } catch {
    return [];
  }
}

export default async function CommunicationPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!ALLOWED.includes(session.role)) redirect('/dashboard');

  const [groups, campaigns] = await Promise.all([
    loadGroups(),
    loadCampaigns(),
  ]);

  const totalContacts = groups.reduce((s, g) => s + g.contactCount, 0);
  const delivered = campaigns.reduce((s, c) => s + c.sentCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication"
        description="Import parent contacts, organise them into groups, and broadcast over SMS, WhatsApp or email."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Contact Groups" value={groups.length} icon={Users} />
        <KPICard label="Total Contacts" value={totalContacts} icon={Users} />
        <KPICard label="Campaigns Sent" value={campaigns.length} icon={Megaphone} />
        <KPICard label="Messages Delivered" value={delivered} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <ImportPanel />
          <GroupsList groups={groups} />
        </div>
        <div className="space-y-6">
          <ComposePanel groups={groups} />
          <HistoryTable campaigns={campaigns} />
        </div>
      </div>

      {campaigns.length === 0 && groups.length === 0 && (
        <p className="text-center text-sm text-gray-400 flex items-center justify-center gap-2 py-2">
          <Send className="w-4 h-4" /> Start by downloading the template and importing your first group.
        </p>
      )}
    </div>
  );
}
