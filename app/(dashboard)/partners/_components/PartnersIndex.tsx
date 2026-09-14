import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { pageAllowed, canEdit as canEditFn } from '@/lib/permissions';
import { Partner, PartnerKind, Session } from '@/types';
import { Building2, CheckCircle2, AlertTriangle, FileText, School } from 'lucide-react';
import { PartnersTable } from './PartnersTable';
import { AddPartnerButton } from './PartnerForm';
import { EXPIRY_WARN_DAYS, PARTNER_KIND } from './partner-config';

export const PARTNER_READ_ROLES = ['BUSINESS_DEVELOPMENT', 'MARKETING_MANAGER', 'MARKETING_STAFF', 'FINANCE', 'MANAGING_DIRECTOR'];
export const PARTNER_WRITE_ROLES = ['BUSINESS_DEVELOPMENT', 'MARKETING_MANAGER', 'MANAGING_DIRECTOR'];

/** Module-level so the render stays pure (react-hooks/purity). */
function expiringSoon(partners: Partner[]): number {
  const now = Date.now();
  const cutoff = now + EXPIRY_WARN_DAYS * 86_400_000;
  let n = 0;
  for (const p of partners) {
    for (const c of p.contracts ?? []) {
      if (c.status === 'ACTIVE' && c.expiryDate) {
        const t = new Date(c.expiryDate).getTime();
        if (t > now && t <= cutoff) n++;
      }
    }
  }
  return n;
}

async function load(kind: PartnerKind): Promise<{ partners: Partner[]; error: string | null }> {
  try {
    const res = await backendFetch(`/partners?kind=${kind}&limit=500`);
    if (!res.ok) return { partners: [], error: `Failed to load (HTTP ${res.status}).` };
    const body = (await res.json()) as { items: Partner[] };
    return { partners: body.items ?? [], error: null };
  } catch {
    return { partners: [], error: 'Unable to reach the backend.' };
  }
}

/** Shared server component behind /schools and /companies. */
export async function PartnersIndex({ kind }: { kind: PartnerKind }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'partners', PARTNER_READ_ROLES)) redirect('/dashboard');
  const canEdit = canEditFn(session, 'partners', PARTNER_WRITE_ROLES);

  const cfg = PARTNER_KIND[kind];
  const { partners, error } = await load(kind);
  const active = partners.filter((p) => p.status === 'ACTIVE').length;
  const contracts = partners.reduce((s, p) => s + (p.contracts?.length ?? 0), 0);
  const soon = expiringSoon(partners);
  const Icon = kind === 'SCHOOL' ? School : Building2;

  return (
    <div className="space-y-6">
      <PageHeader
        title={cfg.pageTitle}
        description={cfg.pageDescription}
        actions={canEdit ? <AddPartnerButton kind={kind} /> : undefined}
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label={`Total ${cfg.plural.toLowerCase()}`} value={partners.length} icon={Icon} />
        <KPICard label="Active partnerships" value={active} icon={CheckCircle2} />
        <KPICard label="Contracts on file" value={contracts} icon={FileText} />
        <KPICard label={`Expiring ≤ ${EXPIRY_WARN_DAYS} days`} value={soon} icon={AlertTriangle} />
      </div>
      {soon > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {soon} active contract{soon === 1 ? '' : 's'} expire{soon === 1 ? 's' : ''} within {EXPIRY_WARN_DAYS} days - start the renewal conversation.
        </p>
      )}
      <PartnersTable kind={kind} partners={partners} canEdit={canEdit} />
    </div>
  );
}
