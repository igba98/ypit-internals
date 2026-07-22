'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, InvoiceStatus, PaymentMethod } from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response) {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string; fieldErrors?: Record<string, string[]> };
  } | null;
  return {
    message: body?.error?.message ?? `Request failed (${res.status}).`,
    errors: body?.error?.fieldErrors,
  };
}

function readLineItems(formData: FormData): {
  description: string;
  quantity: number;
  unitPrice: number;
}[] {
  const raw = formData.get('lineItems');
  if (typeof raw === 'string' && raw.trim().length > 0) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => {
          const o = p as Record<string, unknown>;
          return {
            description: String(o.description ?? '').trim(),
            quantity: Number(o.quantity ?? 1),
            unitPrice: Number(o.unitPrice ?? 0),
          };
        });
      }
    } catch {
      /* fall through */
    }
  }
  const out: { description: string; quantity: number; unitPrice: number }[] = [];
  for (let i = 0; i < 50; i++) {
    const desc = formData.get(`lineItems[${i}][description]`);
    if (typeof desc !== 'string' || desc.trim().length === 0) break;
    out.push({
      description: desc.trim(),
      quantity: Number(formData.get(`lineItems[${i}][quantity]`) ?? 1),
      unitPrice: Number(formData.get(`lineItems[${i}][unitPrice]`) ?? 0),
    });
  }
  if (out.length > 0) return out;

  const singleDesc = formData.get('itemDescription');
  if (typeof singleDesc === 'string' && singleDesc.trim().length > 0) {
    return [
      {
        description: singleDesc.trim(),
        quantity: Number(formData.get('quantity') ?? 1) || 1,
        unitPrice: Number(formData.get('unitPrice') ?? 0),
      },
    ];
  }
  return out;
}

export async function createInvoice(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    recipientType: (formData.get('recipientType') as string | null)?.trim() || 'STUDENT',
    recipientName: (formData.get('recipientName') as string | null)?.trim(),
    description: (formData.get('description') as string | null)?.trim(),
    lineItems: readLineItems(formData),
    tax: Number(formData.get('tax') ?? 0),
    currency: (formData.get('currency') as string | null)?.trim() || 'TZS',
    issueDate: (formData.get('issueDate') as string | null)?.trim(),
    dueDate: (formData.get('dueDate') as string | null)?.trim(),
    notes: (formData.get('notes') as string | null)?.trim() || undefined,
  };
  const recipientId = (formData.get('recipientId') as string | null)?.trim();
  if (recipientId) body.recipientId = recipientId;

  const res = await backendFetch('/finance/invoices', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };

  revalidatePath('/finance/invoices');
  return { success: true, message: 'Invoice created.' };
}

/**
 * One entry point for every choice in the status dropdown:
 *   SENT            → POST /send
 *   VOID            → POST /void
 *   DRAFT, OVERDUE  → POST /status (no money involved)
 *   PAID            → records a payment of the full remaining balance
 *   PARTIAL         → records a payment of `opts.amount`
 * PAID/PARTIAL auto-send a DRAFT invoice first (backend requires SENT).
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  newStatus: InvoiceStatus | string,
  opts?: { amount?: number; paymentMethod?: string },
): Promise<ActionResult> {
  if (newStatus === 'SENT') {
    const res = await backendFetch(`/finance/invoices/${invoiceId}/send`, { method: 'POST' });
    if (!res.ok) return { success: false, ...(await readError(res)) };
  } else if (newStatus === 'VOID') {
    const res = await backendFetch(`/finance/invoices/${invoiceId}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Manually voided' }),
    });
    if (!res.ok) return { success: false, ...(await readError(res)) };
  } else if (newStatus === 'DRAFT' || newStatus === 'OVERDUE') {
    const res = await backendFetch(`/finance/invoices/${invoiceId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return { success: false, ...(await readError(res)) };
  } else if (newStatus === 'PAID' || newStatus === 'PARTIAL') {
    // Load the invoice for its current status + remaining balance.
    const invRes = await backendFetch(`/finance/invoices/${invoiceId}`);
    if (!invRes.ok) return { success: false, ...(await readError(invRes)) };
    const inv = (await invRes.json()) as {
      status: string;
      total: number;
      paidAmount: number;
    };
    const remaining = Math.max(0, inv.total - inv.paidAmount);
    const amount = newStatus === 'PAID' ? remaining : (opts?.amount ?? 0);
    if (amount <= 0) {
      return { success: false, message: 'Nothing left to pay on this invoice.' };
    }
    if (inv.status === 'DRAFT') {
      const sendRes = await backendFetch(`/finance/invoices/${invoiceId}/send`, { method: 'POST' });
      if (!sendRes.ok) return { success: false, ...(await readError(sendRes)) };
    }
    const payRes = await backendFetch(`/finance/invoices/${invoiceId}/payment`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        paymentMethod: opts?.paymentMethod ?? 'BANK_TRANSFER',
      }),
    });
    if (!payRes.ok) return { success: false, ...(await readError(payRes)) };
    revalidatePath('/finance/invoices');
    revalidatePath('/finance/cash-book');
    return {
      success: true,
      message: `Payment of TSh ${amount.toLocaleString()} recorded${newStatus === 'PAID' ? ' — invoice fully paid' : ''}.`,
    };
  } else {
    return { success: false, message: `Unknown status ${newStatus}.` };
  }
  revalidatePath('/finance/invoices');
  return { success: true, message: `Invoice marked ${newStatus.toLowerCase()}.` };
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  paidDate?: string,
  notes?: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/finance/invoices/${invoiceId}/payment`, {
    method: 'POST',
    body: JSON.stringify({ amount, paymentMethod, paidDate, notes }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/invoices');
  return { success: true, message: 'Payment recorded.' };
}
