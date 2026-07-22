'use client';

import { StatusSelect } from '@/components/shared/StatusSelect';
import { INVOICE_STATUS_OPTIONS } from '@/lib/statusOptions';
import { updateInvoiceStatus } from '@/lib/actions/invoiceActions';

const METHODS = ['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'CHEQUE', 'CARD'];

function askMethod(): string | null {
  const raw = window.prompt(
    `Payment method?\n${METHODS.join(' / ')}`,
    'BANK_TRANSFER',
  );
  if (raw === null) return null;
  const method = raw.trim().toUpperCase().replace(/\s+/g, '_');
  return METHODS.includes(method) ? method : 'BANK_TRANSFER';
}

export function InvoiceStatusCell({
  invoiceId,
  value,
  total,
  paidAmount,
}: {
  invoiceId: string;
  value: string;
  total: number;
  paidAmount: number;
}) {
  const remaining = Math.max(0, total - paidAmount);

  const act = async (next: string) => {
    if (next === 'PAID') {
      if (
        !confirm(
          `Record full payment of TSh ${remaining.toLocaleString()} and mark this invoice PAID?`,
        )
      ) {
        return { success: false, message: 'Cancelled.' };
      }
      const method = askMethod();
      if (method === null) return { success: false, message: 'Cancelled.' };
      return updateInvoiceStatus(invoiceId, 'PAID', { paymentMethod: method });
    }
    if (next === 'PARTIAL') {
      const raw = window.prompt(
        `Amount received (TSh)? Remaining balance: ${remaining.toLocaleString()}`,
      );
      if (raw === null) return { success: false, message: 'Cancelled.' };
      const amount = Number(raw.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(amount) || amount <= 0) {
        return { success: false, message: 'Enter a valid amount.' };
      }
      const method = askMethod();
      if (method === null) return { success: false, message: 'Cancelled.' };
      return updateInvoiceStatus(invoiceId, 'PARTIAL', {
        amount,
        paymentMethod: method,
      });
    }
    if (next === 'VOID' && !confirm('Void this invoice? This cannot be undone.')) {
      return { success: false, message: 'Cancelled.' };
    }
    return updateInvoiceStatus(invoiceId, next);
  };

  return (
    <StatusSelect
      value={value}
      options={INVOICE_STATUS_OPTIONS}
      action={act}
      editable
      size="sm"
    />
  );
}
