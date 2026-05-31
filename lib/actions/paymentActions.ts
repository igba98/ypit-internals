'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, PaymentStatus } from '@/types';
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
