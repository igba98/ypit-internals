import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { StaffTable } from './_components/StaffTable';
import { mockUsers } from '@/lib/mock/mockUsers';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { AddStaffButton } from './_components/AddStaffButton';

export default async function StaffPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['MANAGING_DIRECTOR', 'MARKETING_MANAGER']; // Assuming HR/Admin roles
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  const totalStaff = mockUsers.length;
  const activeStaff = mockUsers.filter(u => u.status === 'ACTIVE').length;
  const inactiveStaff = totalStaff - activeStaff;
  const admins = mockUsers.filter(u => u.role === 'MANAGING_DIRECTOR').length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Staff Directory" 
        description="Manage employee accounts, roles, and access permissions."
        actions={
          <AddStaffButton />
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Total Staff" 
          value={totalStaff} 
          icon={Users} 
        />
        <KPICard 
          label="Active Accounts" 
          value={activeStaff} 
          icon={UserCheck} 
        />
        <KPICard 
          label="Inactive Accounts" 
          value={inactiveStaff} 
          icon={UserX} 
        />
        <KPICard 
          label="Administrators" 
          value={admins} 
          icon={Shield} 
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <StaffTable data={mockUsers} />
      </div>
    </div>
  );
}
