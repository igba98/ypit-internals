import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { backendFetch } from '@/lib/backend';
import { pageAllowed, canEdit as canEditFn } from '@/lib/permissions';
import { Partner, PartnerContract, PartnerKind, Session } from '@/types';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Globe, Mail, MapPin, Phone, UserRound, CalendarRange } from 'lucide-react';
import { ContractsCard } from './ContractsCard';
import { FollowUpCard } from './FollowUpCard';
import { PARTNER_KIND, statusBadge } from './partner-config';
import { PARTNER_READ_ROLES, PARTNER_WRITE_ROLES } from './PartnersIndex';

/** Shared server component behind /schools/[id] and /companies/[id]. */
export async function PartnerDetail({ kind, id }: { kind: PartnerKind; id: string }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'partners', PARTNER_READ_ROLES)) redirect('/dashboard');
  const canEdit = canEditFn(session, 'partners', PARTNER_WRITE_ROLES);

  const cfg = PARTNER_KIND[kind];
  const res = await backendFetch(`/partners/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load partner (HTTP ${res.status})`);
  const p = (await res.json()) as Partner;
  if (p.kind !== kind) notFound();
  const contracts = (p.contracts ?? []) as PartnerContract[];

  return (
    <div className="space-y-6">
      <Link href={cfg.base} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> All {cfg.plural.toLowerCase()}
      </Link>
      <PageHeader
        title={p.name}
        description={[p.category, [p.city, p.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || cfg.singular}
        actions={
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge(p.status)}`}>
            {p.status}
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Contact person</p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-gray-900"><UserRound className="w-4 h-4 text-gray-400" /> {p.contactName ?? '-'}{p.contactRole && <span className="text-gray-500">· {p.contactRole}</span>}</p>
              <p className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-gray-400" /> {p.contactPhone ?? '-'}</p>
              <p className="flex items-center gap-2 text-gray-700"><Mail className="w-4 h-4 text-gray-400" /> {p.contactEmail ?? '-'}</p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-2">Organisation</p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4 text-gray-400" /> {[p.address, p.city, p.country].filter(Boolean).join(', ') || '-'}</p>
              <p className="flex items-center gap-2 text-gray-700"><Globe className="w-4 h-4 text-gray-400" /> {p.website ? <a href={p.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{p.website}</a> : '-'}</p>
              <p className="flex items-center gap-2 text-gray-700"><CalendarRange className="w-4 h-4 text-gray-400" /> {p.startDate ? formatDate(p.startDate) : '?'} → {p.expiryDate ? formatDate(p.expiryDate) : 'open-ended'}</p>
            </div>
            {p.notes && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-2">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.notes}</p>
              </>
            )}
            <p className="text-[11px] text-gray-400 pt-2">Added by {p.createdByName} · {formatDate(p.createdAt)}{p.lastContactAt && <> · last contact {formatDate(p.lastContactAt)}</>}</p>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <ContractsCard kind={kind} partnerId={p.id} contracts={contracts} canEdit={canEdit} />
          <FollowUpCard kind={kind} partnerId={p.id} followUps={p.followUps ?? []} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}
