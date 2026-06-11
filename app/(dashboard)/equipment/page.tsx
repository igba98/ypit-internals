import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import {
  EquipmentAssignment,
  Session,
  StaffClearance,
  User,
} from '@/types';
import { Laptop, PackageCheck, AlertTriangle, UserCheck } from 'lucide-react';
import { IssueEquipmentButton } from './_components/IssueEquipmentButton';
import { EquipmentTable } from './_components/EquipmentTable';
import { ClearanceBoard } from './_components/ClearanceBoard';

async function load(): Promise<{
  items: EquipmentAssignment[];
  board: StaffClearance[];
  staff: { id: string; fullName: string }[];
  error: string | null;
}> {
  try {
    const [listRes, boardRes, staffRes] = await Promise.all([
      backendFetch('/equipment?limit=200'),
      backendFetch('/equipment/clearance'),
      backendFetch('/staff?limit=100'),
    ]);
    if (!listRes.ok) {
      return { items: [], board: [], staff: [], error: `Failed to load equipment (HTTP ${listRes.status})` };
    }
    const items = ((await listRes.json()) as { items: EquipmentAssignment[] }).items ?? [];
    const board = boardRes.ok ? ((await boardRes.json()) as StaffClearance[]) : [];
    const staffBody = staffRes.ok ? ((await staffRes.json()) as { items: User[] }) : { items: [] };
    const staff = (staffBody.items ?? []).map((u) => ({ id: u.id, fullName: u.fullName }));
    return { items, board, staff, error: null };
  } catch {
    return { items: [], board: [], staff: [], error: 'Unable to reach the backend.' };
  }
}

export default async function EquipmentPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!['IT_ADMIN', 'MANAGING_DIRECTOR'].includes(session.role)) redirect('/dashboard');

  const { items, board, staff, error } = await load();

  const assignedCount = items.filter((e) => e.status === 'ASSIGNED').length;
  const returnedCount = items.filter((e) => e.status === 'RETURNED').length;
  const faultyCount = items.filter((e) => e.conditionIn === 'DAMAGED' || e.status === 'LOST').length;
  const clearedStaff = board.filter((b) => b.cleared).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Register"
        description="Track assets issued to staff, record returns and faults, and clear leavers."
        actions={<IssueEquipmentButton staff={staff} />}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Currently Assigned" value={assignedCount} icon={Laptop} />
        <KPICard label="Returned" value={returnedCount} icon={PackageCheck} />
        <KPICard label="Faulty / Lost" value={faultyCount} icon={AlertTriangle} />
        <KPICard label="Staff Cleared" value={`${clearedStaff}/${board.length}`} icon={UserCheck} />
      </div>

      <ClearanceBoard board={board} />

      <EquipmentTable items={items} />
    </div>
  );
}
