import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { StaffTable } from './_components/StaffTable';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pageAllowed } from '@/lib/permissions';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { AddStaffButton } from './_components/AddStaffButton';
import { backendFetch } from '@/lib/backend';
import { User } from '@/types';

interface StaffListResponse {
  items: User[];
  total: number;
}

async function loadStaff(): Promise<{ items: User[]; error: string | null }> {
  try {
    const res = await backendFetch('/staff?limit=100');
    if (!res.ok) return { items: [], error: `Failed to load staff (HTTP ${res.status})` };
    const body = (await res.json()) as StaffListResponse;
    return { items: body.items ?? [], error: null };
  } catch {
    return { items: [], error: 'Unable to reach the backend.' };
  }
}

export default async function StaffPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');

  const session = JSON.parse(sessionCookie.value);
  const allowedRoles = ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'IT_ADMIN'];
  if (!pageAllowed(session, 'staff', allowedRoles)) redirect('/dashboard');

  const { items: allStaff, error } = await loadStaff();
  // Marketing Manager's version of this page is their assistant roster only.
  const staff =
    session.role === 'MARKETING_MANAGER'
      ? allStaff.filter((u) => u.role === 'MARKETING_ASSISTANT')
      : allStaff;

  const totalStaff = staff.length;
  const activeStaff = staff.filter(u => u.status === 'ACTIVE').length;
  const inactiveStaff = totalStaff - activeStaff;
  const admins = staff.filter(u => u.role === 'MANAGING_DIRECTOR' || u.role === 'IT_ADMIN').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Directory"
        description="Manage employee accounts, roles, salaries, and access permissions."
        actions={<AddStaffButton />}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Staff" value={totalStaff} icon={Users} />
        <KPICard label="Active Accounts" value={activeStaff} icon={UserCheck} />
        <KPICard label="Inactive Accounts" value={inactiveStaff} icon={UserX} />
        <KPICard label="Administrators" value={admins} icon={Shield} />
      </div>

      <StaffTable data={staff} />
    </div>
  );
}
