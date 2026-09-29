import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { pageAllowed } from '@/lib/permissions';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { PaymentRecord, Session } from '@/types';
import { ArrowLeft, Receipt, Scale, Wallet } from 'lucide-react';
import { EditPaymentButton } from './_components/EditPaymentButton';

const BUCKETS: { label: string; fee: keyof PaymentRecord; paid: keyof PaymentRecord; date: keyof PaymentRecord }[] = [
  { label: 'Application fee', fee: 'applicationFee', paid: 'applicationFeePaid', date: 'applicationFeeDate' },
  { label: 'Tuition fee', fee: 'tuitionFee', paid: 'tuitionFeePaid', date: 'tuitionFeeDate' },
  { label: 'Agency fee', fee: 'agencyFee', paid: 'agencyFeePaid', date: 'agencyFeeDate' },
  { label: 'Hostel fee', fee: 'hostelFee', paid: 'hostelFeePaid', date: 'hostelFeeDate' },
];

const STATUS_CLS: Record<string, string> = {
  CLEARED: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-gray-100 text-gray-700',
  OVERDUE: 'bg-red-100 text-red-700',
};

/** Real payment record for one student, keyed by studentId. */
export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'finance', ['FINANCE', 'MANAGING_DIRECTOR', 'ADMISSIONS'])) redirect('/dashboard');

  const { id: studentId } = await params;
  const res = await backendFetch(`/finance/payments/${studentId}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load the payment record (HTTP ${res.status})`);
  const record = (await res.json()) as PaymentRecord;
  const canEdit = ['FINANCE', 'MANAGING_DIRECTOR'].includes(session.role);

  return (
    <div className="space-y-6">
      <Link href="/payments" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> All payments
      </Link>
      <PageHeader
        title={record.studentName}
        description="Fees, what has been paid, and what is still outstanding."
        actions={canEdit ? <EditPaymentButton record={record} /> : undefined}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total fees" value={formatCurrency(record.totalDue)} icon={Scale} />
        <KPICard label="Total paid" value={formatCurrency(record.totalPaid)} icon={Wallet} />
        <KPICard label="Amount due" value={formatCurrency(record.balance)} icon={Receipt} />
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</p>
          <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_CLS[record.status] ?? ''}`}>
            {record.status}
          </span>
          {record.lastPaymentDate && (
            <p className="text-[11px] text-gray-500 mt-2">Last payment {formatDate(record.lastPaymentDate)}</p>
          )}
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Fee breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Fee type</th>
                <th className="px-4 py-3 font-medium text-right">Fee</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium">Last payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {BUCKETS.map((b) => {
                const fee = Number(record[b.fee] ?? 0);
                const paid = Number(record[b.paid] ?? 0);
                const when = record[b.date] as string | null | undefined;
                const left = fee - paid;
                return (
                  <tr key={b.label} className={fee === 0 && paid === 0 ? 'text-gray-400' : ''}>
                    <td className="px-4 py-2.5 font-medium">{b.label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fee > 0 ? formatCurrency(fee) : '-'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-green-700">{paid > 0 ? formatCurrency(paid) : '-'}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${left > 0 ? 'text-amber-700 font-semibold' : ''}`}>
                      {left > 0 ? formatCurrency(left) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{when ? formatDate(when) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2.5">Totals</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(record.totalDue)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-green-700">{formatCurrency(record.totalPaid)}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${record.balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {formatCurrency(record.balance)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Receipts</h3>
          {record.receiptNumbers && record.receiptNumbers.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {record.receiptNumbers.map((r, i) => (
                <li key={`${r}-${i}`} className="px-2 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-700">{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No receipts recorded yet.</p>
          )}
        </section>
        <section className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.notes || <span className="text-gray-400">None.</span>}</p>
        </section>
      </div>
    </div>
  );
}
