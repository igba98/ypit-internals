import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { canEdit, pageAllowed } from '@/lib/permissions';
import { listAssets } from '@/lib/actions/adminRecordActions';
import { Session } from '@/types';
import { Boxes, Laptop, Wrench, Archive } from 'lucide-react';
import { AssetsTable } from './_components/AssetsTable';

const READ = ['OPERATIONS', 'IT_ADMIN', 'FINANCE', 'MANAGING_DIRECTOR'];
const WRITE = ['OPERATIONS', 'MANAGING_DIRECTOR'];

/** Company asset register kept by the Administrator (system updates 2.0 §5). */
export default async function AssetsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'assets', READ)) redirect('/dashboard');
  const writable = canEdit(session, 'assets', WRITE);

  const data = await listAssets();
  const items = data?.items ?? [];
  const equipmentOut = data?.equipment.find((e) => e.status === 'ASSIGNED')?._count ?? 0;
  const value = items.filter((a) => a.status !== 'DISPOSED').reduce((s, a) => s + (a.purchaseCost ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Assets"
        description="Every company asset - furniture, vehicles, office equipment, property. IT laptops and phones issued to staff stay in the IT Equipment register."
      />
      {!data && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">Unable to load the asset register.</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Registered assets" value={items.filter((a) => a.status !== 'DISPOSED').length} icon={Boxes} />
        <KPICard label="Under repair" value={items.filter((a) => a.status === 'UNDER_REPAIR').length} icon={Wrench} />
        <KPICard label="Recorded value (TSh)" value={value.toLocaleString('en-US')} icon={Archive} />
        <KPICard label="IT items issued to staff" value={equipmentOut} icon={Laptop} />
      </div>
      <p className="text-xs text-gray-500">
        IT hand-outs (laptops, phones, SIM cards) are tracked per staff member in{' '}
        <Link href="/equipment" className="text-primary hover:underline">IT Equipment</Link>.
      </p>
      <AssetsTable assets={items} canEdit={writable} />
    </div>
  );
}
