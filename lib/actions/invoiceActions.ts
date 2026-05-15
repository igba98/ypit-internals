'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { mockInvoices } from '../mock/mockInvoices';
import { invoiceSchema } from '../validations/finance';
import { ActionResult, Invoice, InvoiceStatus, PaymentMethod } from '@/types';

const INVOICE_STATUSES: InvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'VOID'];
const PAYMENT_METHODS: PaymentMethod[] = ['BANK_TRANSFER', 'CASH', 'CHEQUE', 'CARD', 'MOBILE_MONEY', 'PETTY_CASH'];

function nextInvoiceId(): string {
  const year = new Date().getFullYear();
  const max = mockInvoices
    .filter(i => i.id.startsWith(`INV-${year}-`))
    .reduce((m, i) => {
      const n = parseInt(i.id.split('-')[2] ?? '0', 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
  return `INV-${year}-${String(max + 1).padStart(4, '0')}`;
}

async function currentUser() {
  const c = await cookies();
  const cookie = c.get('ypit_session');
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value) as { userId: string; fullName: string };
  } catch {
    return null;
  }
}

export async function createInvoice(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  const parsed = invoiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the validation errors.',
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const v = parsed.data;
  const subtotal = v.quantity * v.unitPrice;
  const total = subtotal + (v.tax || 0);
  const user = await currentUser();

  const invoice: Invoice = {
    id: nextInvoiceId(),
    recipientType: v.recipientType,
    recipientId: v.recipientId || undefined,
    recipientName: v.recipientName,
    description: v.description,
    lineItems: [
      { description: v.itemDescription, quantity: v.quantity, unitPrice: v.unitPrice, total: subtotal },
    ],
    subtotal,
    tax: v.tax || 0,
    total,
    currency: v.currency || 'TZS',
    issueDate: new Date(v.issueDate).toISOString(),
    dueDate: new Date(v.dueDate).toISOString(),
    status: 'SENT',
    paidAmount: 0,
    notes: v.notes,
    createdById: user?.userId,
    createdByName: user?.fullName,
    createdAt: new Date().toISOString(),
  };

  mockInvoices.unshift(invoice);

  revalidatePath('/finance');
  revalidatePath('/finance/invoices');

  return { success: true, message: `Invoice ${invoice.id} created.` };
}

export async function updateInvoiceStatus(invoiceId: string, newStatus: string): Promise<ActionResult> {
  if (!INVOICE_STATUSES.includes(newStatus as InvoiceStatus)) {
    return { success: false, message: 'Invalid invoice status.' };
  }
  const inv = mockInvoices.find(i => i.id === invoiceId);
  if (!inv) return { success: false, message: 'Invoice not found.' };

  inv.status = newStatus as InvoiceStatus;
  if (inv.status === 'PAID') {
    inv.paidAmount = inv.total;
    if (!inv.paidDate) inv.paidDate = new Date().toISOString();
  }

  revalidatePath('/finance');
  revalidatePath('/finance/invoices');
  revalidatePath(`/finance/invoices/${invoiceId}`);

  return { success: true, message: `Invoice marked as ${newStatus.toLowerCase()}.` };
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  method: string,
): Promise<ActionResult> {
  if (!PAYMENT_METHODS.includes(method as PaymentMethod)) {
    return { success: false, message: 'Invalid payment method.' };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: 'Amount must be a positive number.' };
  }
  const inv = mockInvoices.find(i => i.id === invoiceId);
  if (!inv) return { success: false, message: 'Invoice not found.' };
  if (inv.status === 'VOID') return { success: false, message: 'Cannot pay a voided invoice.' };

  inv.paidAmount = Math.min(inv.total, inv.paidAmount + amount);
  inv.paymentMethod = method as PaymentMethod;
  inv.paidDate = new Date().toISOString();
  inv.status = inv.paidAmount >= inv.total ? 'PAID' : 'PARTIAL';

  revalidatePath('/finance');
  revalidatePath('/finance/invoices');

  return { success: true, message: `Recorded payment on ${inv.id}.` };
}
