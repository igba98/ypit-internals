import { PageHeader } from '@/components/shared/PageHeader';
import { mockInvoices } from '@/lib/mock/mockInvoices';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { Building2, GraduationCap, FileText, ArrowDownCircle, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { NewInvoiceButton } from './_components/NewInvoiceButton';
import { InvoiceStatusCell } from './_components/InvoiceStatusCell';
import { InvoiceRecipientType } from '@/types';

const RECIPIENT_META: Record<InvoiceRecipientType, { icon: React.ElementType; iconClass: string; label: string }> = {
  STUDENT: { icon: GraduationCap, iconClass: 'bg-primary-muted text-primary', label: 'Student' },
  VENDOR: { icon: Building2, iconClass: 'bg-blue-50 text-blue-700', label: 'Vendor' },
  OTHER: { icon: FileText, iconClass: 'bg-gray-50 text-gray-600', label: 'Other' },
};

export default async function InvoicesPage() {
  const sorted = [...mockInvoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalIssued = mockInvoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = mockInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = totalIssued - totalPaid;
  const overdueAmount = mockInvoices
    .filter(i => i.status === 'OVERDUE')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const overdueCount = mockInvoices.filter(i => i.status === 'OVERDUE').length;

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Issue and track bills for students and vendors."
        actions={<NewInvoiceButton />}
      />

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile icon={FileText} label="Issued" value={formatCurrency(totalIssued)} sub={`${mockInvoices.length} invoices`} />
        <KpiTile icon={CheckCircle2} label="Collected" value={formatCurrency(totalPaid)} sub={`${mockInvoices.filter(i => i.status === 'PAID').length} paid`} tone="success" />
        <KpiTile icon={ArrowDownCircle} label="Outstanding" value={formatCurrency(outstanding)} sub="Pending collection" tone="warning" />
        <KpiTile icon={AlertCircle} label="Overdue" value={formatCurrency(overdueAmount)} sub={`${overdueCount} invoice${overdueCount === 1 ? '' : 's'}`} tone={overdueCount > 0 ? 'danger' : 'default'} />
      </section>

      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Invoice Register</h3>
          <span className="text-xs text-gray-500">{sorted.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Recipient</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Issued · Due</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium text-right">Paid</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(inv => {
                const meta = RECIPIENT_META[inv.recipientType];
                const RIcon = meta.icon;
                const isOverdue = inv.status === 'OVERDUE';
                return (
                  <tr key={inv.id} className={`hover:bg-gray-50/60 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{inv.id}</p>
                      <p className="text-[11px] text-gray-500">by {inv.createdByName ?? 'system'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${meta.iconClass}`}>
                          <RIcon className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{inv.recipientName}</p>
                          <p className="text-[11px] text-gray-500">{meta.label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 max-w-[260px] truncate" title={inv.description}>{inv.description}</p>
                      {inv.lineItems[0] && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{inv.lineItems[0].quantity}× {formatCurrency(inv.lineItems[0].unitPrice, { currency: inv.currency })}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 text-xs">{formatDate(inv.issueDate)}</p>
                      <p className={`text-[11px] ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        Due {formatDate(inv.dueDate)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                      {formatCurrency(inv.total, { currency: inv.currency })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className={`font-semibold ${inv.paidAmount >= inv.total ? 'text-green-600' : inv.paidAmount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {formatCurrency(inv.paidAmount, { currency: inv.currency })}
                      </p>
                      {inv.paidDate && (
                        <p className="text-[11px] text-gray-500 mt-0.5 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(inv.paidDate)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <InvoiceStatusCell invoiceId={inv.id} value={inv.status} />
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">No invoices yet. Click <strong>New Invoice</strong> to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    default: 'bg-gray-50 text-gray-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
  }[tone];
  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1.5 truncate">{value}</p>
          <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${tones} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
