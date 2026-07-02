import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { Mou, Session, University } from '@/types';
import { ScrollText, CheckCircle2, AlertTriangle, CalendarX } from 'lucide-react';
import { MouTable } from './_components/MouTable';
import { AddMouButton } from './_components/MouForm';

const ALLOWED = ['FINANCE', 'MANAGING_DIRECTOR'];
const EXPIRY_WARN_DAYS = 60;

/** Module-level so the component render stays pure (react-hooks/purity). */
function computeExpiryStats(mous: Mou[]): {
  active: Mou[];
  expiringSoon: Mou[];
  expired: Mou[];
} {
  const now = Date.now();
  const warnCutoff = now + EXPIRY_WARN_DAYS * 86_400_000;
  const active = mous.filter((m) => m.status === 'ACTIVE');
  const expiringSoon = active.filter(
    (m) =>
      m.expiryDate &&
      new Date(m.expiryDate).getTime() > now &&
      new Date(m.expiryDate).getTime() <= warnCutoff,
  );
  const expired = mous.filter(
    (m) =>
      m.status === 'EXPIRED' ||
      (m.expiryDate && new Date(m.expiryDate).getTime() <= now),
  );
  return { active, expiringSoon, expired };
}

async function load(): Promise<{
  mous: Mou[];
  universities: University[];
  error: string | null;
}> {
  try {
    const [mouRes, uniRes] = await Promise.all([
      backendFetch('/mous'),
      backendFetch('/finance/universities?limit=500'),
    ]);
    if (!mouRes.ok) {
      return {
        mous: [],
        universities: [],
        error: `Failed to load MOUs (HTTP ${mouRes.status}).`,
      };
    }
    const mouBody = (await mouRes.json()) as { items: Mou[] };
    const uniBody = uniRes.ok
      ? ((await uniRes.json()) as { items: University[] })
      : { items: [] };
    return {
      mous: mouBody.items ?? [],
      universities: uniBody.items ?? [],
      error: null,
    };
  } catch {
    return { mous: [], universities: [], error: 'Unable to reach the backend.' };
  }
}

export default async function MousPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!ALLOWED.includes(session.role)) redirect('/dashboard');

  const { mous, universities, error } = await load();
  const { active, expiringSoon, expired } = computeExpiryStats(mous);

  return (
    <div className="space-y-6">
      <PageHeader
        title="MOU Documents"
        description="Memorandums of Understanding with universities — visible to Finance and the CEO only."
        actions={<AddMouButton universities={universities} />}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total MOUs" value={mous.length} icon={ScrollText} />
        <KPICard label="Active" value={active.length} icon={CheckCircle2} />
        <KPICard
          label={`Expiring ≤ ${EXPIRY_WARN_DAYS} days`}
          value={expiringSoon.length}
          icon={AlertTriangle}
        />
        <KPICard label="Expired" value={expired.length} icon={CalendarX} />
      </div>

      {expiringSoon.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {expiringSoon.length} active MOU{expiringSoon.length === 1 ? '' : 's'}{' '}
          expire{expiringSoon.length === 1 ? 's' : ''} within {EXPIRY_WARN_DAYS}{' '}
          days — start the renewal conversation.
        </p>
      )}

      <MouTable mous={mous} universities={universities} />
    </div>
  );
}
