import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { PaymentsTable } from './_components/PaymentsTable';
import { mockPayments } from '@/lib/mock/mockPayments';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { RecordPaymentButton } from './_components/RecordPaymentButton';

export default async function PaymentsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  
  // Role check
  const allowedRoles = ['FINANCE', 'MANAGING_DIRECTOR'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  const totalCollected = mockPayments.reduce((sum, p) => sum + p.totalPaid, 0);
  const pendingCount = mockPayments.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL').length;
  const overdueCount = mockPayments.filter(p => p.status === 'OVERDUE').length;
  const clearedCount = mockPayments.filter(p => p.status === 'CLEARED').length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payments & Finance" 
        description="Manage student payments, agency fees, and tuition."
        actions={
          <div className="flex items-center gap-3">
            {session.role === 'FINANCE' && (
              <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Submit Report
              </button>
            )}
            {['FINANCE', 'MANAGING_DIRECTOR'].includes(session.role) && (
              <RecordPaymentButton />
            )}
           </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Total Collected" 
          value={`TZS ${(totalCollected / 1000000).toFixed(1)}M`} 
          icon={DollarSign} 
        />
        <KPICard 
          label="Pending Payments" 
          value={pendingCount} 
          icon={Clock} 
        />
        <KPICard 
          label="Overdue" 
          value={overdueCount} 
          icon={AlertCircle} 
          trendDirection="down"
        />
        <KPICard 
          label="Fully Cleared" 
          value={clearedCount} 
          icon={CheckCircle2} 
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <PaymentsTable data={mockPayments} />
      </div>
    </div>
  );
}
