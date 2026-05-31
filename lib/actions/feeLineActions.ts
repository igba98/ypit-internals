'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, FeeLineStatus } from '@/types';
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

export async function updateFeeLineStatus(
  studentId: string,
  lineId: string,
  newStatus: FeeLineStatus,
  reason?: string,
): Promise<ActionResult> {
  if (newStatus !== 'WAIVED' && newStatus !== 'OVERDUE') {
    return {
      success: false,
      message: `Status ${newStatus} can't be set directly — use payment recording or override.`,
    };
  }
  const res = await backendFetch(
    `/finance/students/${studentId}/ledger/lines/${lineId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        reason: reason && reason.length >= 3 ? reason : 'Manual status change',
      }),
    },
  );
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: `Fee line marked ${newStatus.toLowerCase()}.` };
}

export async function overrideFeeLine(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const studentId = (formData.get('studentId') as string | null)?.trim();
  const lineId = (formData.get('lineId') as string | null)?.trim();
  if (!studentId || !lineId) {
    return { success: false, message: 'Missing studentId or lineId.' };
  }

  const body: Record<string, unknown> = {
    reason: (formData.get('reason') as string | null)?.trim() || 'Manual override',
  };
  const amount = (formData.get('amount') as string | null)?.trim();
  if (amount) body.amount = Number(amount);
  const dueDate = (formData.get('dueDate') as string | null)?.trim();
  if (dueDate) body.dueDate = dueDate;
  const label = (formData.get('label') as string | null)?.trim();
  if (label) body.label = label;
  const status = (formData.get('status') as string | null)?.trim();
  if (status === 'WAIVED' || status === 'OVERDUE') body.status = status;

  const res = await backendFetch(
    `/finance/students/${studentId}/ledger/lines/${lineId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Fee line updated.' };
}

export async function recordFeeLinePayment(
  studentId: string,
  lineId: string,
  amount: number,
  receiptNumber?: string,
  notes?: string,
): Promise<ActionResult> {
  const res = await backendFetch(
    `/finance/students/${studentId}/ledger/lines/${lineId}/payment`,
    {
      method: 'POST',
      body: JSON.stringify({ amount, receiptNumber, notes }),
    },
  );
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/payments');
  return { success: true, message: 'Payment recorded.' };
}
