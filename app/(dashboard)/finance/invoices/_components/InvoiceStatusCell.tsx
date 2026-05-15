'use client';

import { StatusSelect } from '@/components/shared/StatusSelect';
import { INVOICE_STATUS_OPTIONS } from '@/lib/statusOptions';
import { updateInvoiceStatus } from '@/lib/actions/invoiceActions';

export function InvoiceStatusCell({ invoiceId, value }: { invoiceId: string; value: string }) {
  return (
    <StatusSelect
      value={value}
      options={INVOICE_STATUS_OPTIONS}
      action={next => updateInvoiceStatus(invoiceId, next)}
      editable
      size="sm"
    />
  );
}
