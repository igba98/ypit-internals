'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, PaymentRecord, PaymentStatus } from '@/types';
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

/**
 * The backend computes PaymentRecord status from totalDue / totalPaid, so
 * direct status mutation is no longer a first-class operation. We surface a
 * notes-tagged PATCH so the UI keeps working; the canonical status advance
 * happens via `recordPayment` below.
 */
export async function updatePaymentStatus(
  studentId: string,
  newStatus: PaymentStatus | string,
): Promise<ActionResult> {
  const res = await backendFetch(`/finance/payments/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      notes: `[manual] status reviewed as ${newStatus} on ${new Date().toISOString().slice(0, 10)}`,
    }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/payments');
  return { success: true, message: `Payment marked ${newStatus.toLowerCase()}.` };
}

/**
 * Record a payment against one of the four buckets on a student's
 * PaymentRecord. FormData carries: studentId, bucket, amount, receiptNumber.
 */
export async function recordPayment(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const studentId = (formData.get('studentId') as string | null)?.trim();
  const bucket = (formData.get('bucket') as string | null)?.trim()?.toUpperCase();
  const amountRaw = (formData.get('amount') as string | null)?.trim();
  const receiptNumber = (formData.get('receiptNumber') as string | null)?.trim();
  const notes = (formData.get('notes') as string | null)?.trim() || undefined;

  if (!studentId || !bucket || !amountRaw || !receiptNumber) {
    return {
      success: false,
      message: 'studentId, bucket, amount and receiptNumber are required.',
    };
  }
  if (
    bucket !== 'AGENCY' &&
    bucket !== 'APPLICATION' &&
    bucket !== 'TUITION' &&
    bucket !== 'HOSTEL'
  ) {
    return {
      success: false,
      message: 'bucket must be one of AGENCY | APPLICATION | TUITION | HOSTEL.',
    };
  }

  const res = await backendFetch(`/finance/payments/${studentId}/record`, {
    method: 'POST',
    body: JSON.stringify({
      bucket,
      amount: Number(amountRaw),
      receiptNumber,
      notes,
    }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };

  revalidatePath('/payments');
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Payment recorded.' };
}

/**
 * Sends the bilingual (Swahili + English) tuition payment reminder SMS/WhatsApp
 * to the student and their primary parent.
 */
export async function sendTuitionReminder(
  studentId: string,
): Promise<ActionResult> {
  const res = await backendFetch(
    `/finance/payments/${studentId}/tuition-reminder`,
    { method: 'POST' },
  );
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const body = (await res.json()) as { outstanding: number };
  return {
    success: true,
    message: `Tuition reminder sent (TZS ${body.outstanding.toLocaleString()} outstanding).`,
  };
}

// ── Multi-fee recording (client feedback, Sept 2026) ───────────────

export interface PaymentLineInput {
  bucket: 'AGENCY' | 'APPLICATION' | 'TUITION' | 'HOSTEL';
  /** Absolute fee for this type. Omit to leave it alone. */
  fee?: number;
  /** Money received now for this type. */
  amount?: number;
}

/** A student's current record, or null when they have none yet. */
export async function getPaymentRecord(
  studentId: string,
): Promise<PaymentRecord | null> {
  try {
    const res = await backendFetch(`/finance/payments/${studentId}`);
    if (!res.ok) return null;
    return (await res.json()) as PaymentRecord;
  } catch {
    return null;
  }
}

/**
 * Save several fee types at once. The backend works out total paid, balance
 * and status, and writes one cash-book receipt for the money received.
 */
export async function recordPayments(
  studentId: string,
  input: {
    lines: PaymentLineInput[];
    receiptNumber?: string;
    paymentMethod?: string;
    paymentDate?: string;
    notes?: string;
  },
): Promise<ActionResult & { record?: PaymentRecord }> {
  const res = await backendFetch(`/finance/payments/${studentId}/record-many`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const record = (await res.json()) as PaymentRecord;
  revalidatePath('/payments');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/finance/cash-book');
  const received = input.lines.reduce((n, l) => n + (l.amount ?? 0), 0);
  return {
    success: true,
    record,
    message:
      received > 0
        ? `Recorded TSh ${received.toLocaleString('en-US')}. Balance now TSh ${record.balance.toLocaleString('en-US')}.`
        : 'Fees updated.',
  };
}

export interface PaymentCorrectionLine {
  bucket: 'APPLICATION' | 'TUITION' | 'AGENCY' | 'HOSTEL';
  /** What should stand as paid for this fee type. 0 clears it. */
  paid?: number;
  /** The fee itself, when that is what was mis-typed. */
  fee?: number;
}

/**
 * Fix a mis-keyed payment - the amounts are absolute, not additions, so
 * 1,350,000 typed instead of 135,000 can simply be retyped (or cleared to 0).
 * The difference is posted to the cash book as a correction, which is why a
 * reason is required.
 */
export async function correctPayments(
  studentId: string,
  input: {
    lines: PaymentCorrectionLine[];
    reason: string;
    paymentMethod?: string;
    date?: string;
  },
): Promise<ActionResult & { record?: PaymentRecord }> {
  const res = await backendFetch(`/finance/payments/${studentId}/correct`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const record = (await res.json()) as PaymentRecord;
  revalidatePath('/payments');
  revalidatePath(`/payments/${studentId}`);
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/finance/cash-book');
  return {
    success: true,
    record,
    message: `Corrected. Total paid is now TSh ${record.totalPaid.toLocaleString('en-US')}, amount due TSh ${record.balance.toLocaleString('en-US')}.`,
  };
}
