'use client';

import { PaymentRecord, Role } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusSelect } from '@/components/shared/StatusSelect';
import { PAYMENT_STATUS_OPTIONS, canEdit } from '@/lib/statusOptions';
import { updatePaymentStatus } from '@/lib/actions/paymentActions';
import {
  DollarSign,
  Briefcase,
  FileText,
  GraduationCap,
  Home,
  Receipt,
  XCircle,
  Wallet,
  TrendingUp,
} from 'lucide-react';

interface PaymentsTabProps {
  payment: PaymentRecord | null;
  userRole: Role;
}

interface FeeRowProps {
  icon: React.ElementType;
  label: string;
  total: number;
  paid: number;
  currency: string;
  paidDate?: string;
}

function FeeRow({ icon: Icon, label, total, paid, currency, paidDate }: FeeRowProps) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const fullyPaid = paid >= total && total > 0;
  const unpaid = paid === 0;

  return (
    <div className="rounded-lg border border-gray-100 p-4 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${fullyPaid ? 'bg-green-50 text-green-600' : unpaid ? 'bg-gray-50 text-gray-400' : 'bg-amber-50 text-amber-600'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            {paidDate && <p className="text-[11px] text-gray-500">Last paid {formatDate(paidDate)}</p>}
            {!paidDate && unpaid && <p className="text-[11px] text-gray-400">Not paid yet</p>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">{formatCurrency(paid, currency)}</p>
          <p className="text-[11px] text-gray-500">of {formatCurrency(total, currency)}</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fullyPaid ? 'bg-green-500' : unpaid ? 'bg-gray-300' : 'bg-gradient-to-r from-primary to-primary-light'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-500 mt-1.5 text-right font-medium">{pct}% paid</p>
    </div>
  );
}

export function PaymentsTab({ payment, userRole }: PaymentsTabProps) {
  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Wallet className="w-7 h-7 text-gray-400" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">No payment record yet</h4>
        <p className="text-xs text-gray-500 mt-1">A payment invoice will appear here once Finance creates one.</p>
      </div>
    );
  }

  const paidPct = payment.totalDue > 0 ? Math.round((payment.totalPaid / payment.totalDue) * 100) : 0;
  const editable = canEdit('paymentStatus', userRole);

  return (
    <div className="space-y-6">
      {/* Hero summary */}
      <div className="relative rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white p-6 overflow-hidden shadow-primary-glow">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">Total Due</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(payment.totalDue, payment.currency)}</p>
              <p className="text-xs text-white/70 mt-1">across {payment.receiptNumbers.length} receipt{payment.receiptNumbers.length === 1 ? '' : 's'}</p>
            </div>
            <StatusSelect
              value={payment.status}
              options={PAYMENT_STATUS_OPTIONS}
              action={next => updatePaymentStatus(payment.id, next)}
              editable={editable}
              onDark
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/15">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/70">Paid</p>
              <p className="text-lg font-bold mt-0.5">{formatCurrency(payment.totalPaid, payment.currency)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/70">Balance</p>
              <p className="text-lg font-bold mt-0.5">{formatCurrency(payment.balance, payment.currency)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/70">Progress</p>
              <p className="text-lg font-bold mt-0.5">{paidPct}%</p>
            </div>
          </div>

          <div className="mt-4 h-2 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${paidPct}%` }} />
          </div>
        </div>
      </div>

      {/* Fee breakdown */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Fee Breakdown
          </h3>
          {payment.lastPaymentDate && (
            <p className="text-xs text-gray-500">Last activity {formatDate(payment.lastPaymentDate)}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FeeRow icon={Briefcase} label="Agency Fee" total={payment.agencyFee} paid={payment.agencyFeePaid} currency={payment.currency} paidDate={payment.agencyFeeDate} />
          <FeeRow icon={FileText} label="Application Fee" total={payment.applicationFee} paid={payment.applicationFeePaid} currency={payment.currency} paidDate={payment.applicationFeeDate} />
          <FeeRow icon={GraduationCap} label="Tuition Fee" total={payment.tuitionFee} paid={payment.tuitionFeePaid} currency={payment.currency} paidDate={payment.tuitionFeeDate} />
          <FeeRow icon={Home} label="Hostel / Accommodation" total={payment.hostelFee} paid={payment.hostelFeePaid} currency={payment.currency} paidDate={payment.hostelFeeDate} />
        </div>
      </section>

      {/* Receipts */}
      {payment.receiptNumbers.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Receipts
          </h3>
          <div className="flex flex-wrap gap-2">
            {payment.receiptNumbers.map(r => (
              <span key={r} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-100 text-xs font-medium text-gray-700">
                <DollarSign className="w-3 h-3 text-primary" />
                {r}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      {payment.notes && (
        <section className="rounded-lg border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-800 mb-1">Finance Note</p>
          <p className="text-sm text-gray-700 leading-relaxed">{payment.notes}</p>
        </section>
      )}

      {payment.status === 'OVERDUE' && (
        <section className="rounded-lg border border-red-200 bg-red-50/60 p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Payment is overdue</p>
            <p className="text-xs text-red-700 mt-0.5">Escalate to the assigned lead or contact the student directly.</p>
          </div>
        </section>
      )}
    </div>
  );
}
