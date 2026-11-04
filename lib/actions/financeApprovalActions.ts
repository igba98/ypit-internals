'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, FinanceApproval } from '@/types';
import { backendFetch } from '@/lib/backend';

/**
 * Finance approval checkpoints (client request, Nov 2026). Finance signs off
 * after each section of the journey; each checkpoint blocks the stage after it.
 */

async function readError(res: Response): Promise<{ message: string }> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return { message: body?.error?.message ?? `Request failed (${res.status}).` };
}

export async function listFinanceApprovals(
  status?: string,
): Promise<FinanceApproval[] | null> {
  const qs = new URLSearchParams({ limit: '200' });
  if (status) qs.set('status', status);
  try {
    const res = await backendFetch(`/finance/approvals?${qs.toString()}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { items?: FinanceApproval[] };
    return body.items ?? [];
  } catch {
    return null;
  }
}

/** Every checkpoint for one student - shown on their profile. */
export async function getStudentApprovals(studentId: string): Promise<{
  items: FinanceApproval[];
  outstanding: number | null;
} | null> {
  try {
    const res = await backendFetch(`/finance/approvals/student/${studentId}`);
    if (!res.ok) return null;
    return (await res.json()) as {
      items: FinanceApproval[];
      outstanding: number | null;
    };
  } catch {
    return null;
  }
}

export async function approveCheckpoint(
  id: string,
  notes?: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/finance/approvals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes?.trim() || undefined }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/approvals');
  return { success: true, message: 'Approved - the student can move on.' };
}

export async function rejectCheckpoint(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/finance/approvals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/approvals');
  return { success: true, message: 'Held back - the officer will see why.' };
}
