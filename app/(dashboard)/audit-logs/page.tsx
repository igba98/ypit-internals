import { PageHeader } from '@/components/shared/PageHeader';
import { AuditLogTable } from './_components/AuditLogTable';
import { mockAuditLogs } from '@/lib/mock/mockAuditLogs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AuditLogsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['MANAGING_DIRECTOR'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Audit Logs" 
        description="System-wide activity tracking for security and compliance."
      />
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <AuditLogTable data={mockAuditLogs} />
      </div>
    </div>
  );
}
