import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { backendFetch } from '@/lib/backend';
import { pageAllowed } from '@/lib/permissions';
import { Mou, Package, Session, University, UniversityPartnership } from '@/types';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Globe, GraduationCap, Handshake, Mail, MapPin, Phone, ScrollText, Sparkles, UserRound } from 'lucide-react';
import { UNI_READ_ROLES, UNI_WRITE_ROLES } from '../_components/roles';
import { EditUniversityButton } from './_components/EditUniversityButton';

const PARTNERSHIP_LABEL: Record<string, string> = {
  PROSPECT: 'Prospect', IN_DISCUSSION: 'In discussion', MOU_SIGNED: 'MOU signed',
  ACTIVE: 'Active', DORMANT: 'Dormant', ENDED: 'Ended',
};

async function safeList<T>(path: string): Promise<T[]> {
  try {
    const res = await backendFetch(path);
    if (!res.ok) return [];
    const body = (await res.json()) as { items?: T[] } | T[];
    return Array.isArray(body) ? body : (body.items ?? []);
  } catch {
    return [];
  }
}

export default async function UniversityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'catalog', UNI_READ_ROLES)) redirect('/dashboard');
  const canEdit = UNI_WRITE_ROLES.includes(session.role);

  const { id } = await params;
  const res = await backendFetch(`/finance/universities/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load university (HTTP ${res.status})`);
  const u = (await res.json()) as University;

  // Sibling data - each degrades to [] for roles without that module.
  const [packages, mous, partnerships] = await Promise.all([
    safeList<Package>(`/finance/packages?universityId=${id}&limit=200`),
    safeList<Mou>('/mous'),
    safeList<UniversityPartnership & { university?: { id: string } }>('/business-dev/partnerships'),
  ]);
  const uniMous = mous.filter((m) => m.universityId === id);
  const partnership = partnerships.find((p) => p.universityId === id) ?? null;

  return (
    <div className="space-y-6">
      <Link href="/universities" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> All universities
      </Link>
      <PageHeader
        title={u.name}
        description={`${u.scope === 'LOCAL' ? 'Local' : 'International'} · ${[u.city, u.country].filter(Boolean).join(', ')}`}
        actions={canEdit ? <EditUniversityButton university={u} /> : undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5 space-y-3 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Profile</p>
            <p className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4 text-gray-400" /> {[u.city, u.country].filter(Boolean).join(', ')}</p>
            <p className="flex items-center gap-2 text-gray-700"><Globe className="w-4 h-4 text-gray-400" /> {u.website ? <a href={u.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{u.website}</a> : '-'}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-2">Contact</p>
            <p className="flex items-center gap-2 text-gray-900"><UserRound className="w-4 h-4 text-gray-400" /> {u.contactName ?? '-'}</p>
            <p className="flex items-center gap-2 text-gray-700"><Mail className="w-4 h-4 text-gray-400" /> {u.contactEmail ?? '-'}</p>
            <p className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-gray-400" /> {u.contactPhone ?? '-'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5" /> Partnership status</p>
            {partnership ? (
              <>
                <p className="text-lg font-bold text-gray-900">{PARTNERSHIP_LABEL[partnership.status] ?? partnership.status}</p>
                {partnership.commissionTerms && <p className="text-xs text-gray-600">Commission: {partnership.commissionTerms}</p>}
                {partnership.lastContactAt && <p className="text-[11px] text-gray-500">Last contact {formatDate(partnership.lastContactAt)}</p>}
                <Link href="/business-development" className="text-xs text-primary hover:underline">Manage in Business Dev →</Link>
              </>
            ) : (
              <p className="text-sm text-gray-500">Not tracked yet. <Link href="/business-development" className="text-primary hover:underline">Start in Business Dev →</Link></p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Programmes / courses</p>
            {u.programsSummary ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{u.programsSummary}</p> : <p className="text-sm text-gray-400">No programme overview recorded.</p>}
            {packages.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-gray-600 mb-1">Priced packages ({packages.length})</p>
                <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {packages.map((p) => (
                    <li key={p.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                      <span className="text-gray-900">{p.program}<span className="text-gray-400"> · {p.studyLevel.toLowerCase()}</span></span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-400'}`}>{p.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Scholarship opportunities</p>
            {u.scholarshipNotes ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{u.scholarshipNotes}</p> : <p className="text-sm text-gray-400">None recorded.</p>}
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><ScrollText className="w-3.5 h-3.5" /> Agreements / contracts (MOUs)</p>
            {uniMous.length === 0 ? (
              <p className="text-sm text-gray-400">No MOU on file{mous.length === 0 && ' (or your role cannot view MOUs)'}. <Link href="/mous" className="text-primary hover:underline">MOU register →</Link></p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {uniMous.map((m) => (
                  <li key={m.id} className="py-2 text-sm flex items-center justify-between gap-3">
                    <div>
                      <p className="text-gray-900 font-medium">{m.title}</p>
                      <p className="text-[11px] text-gray-500">{m.signedDate ? `Signed ${formatDate(m.signedDate)}` : 'Unsigned'}{m.expiryDate && ` · expires ${formatDate(m.expiryDate)}`}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">{m.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
