'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, CscaExamRecord } from '@/types';
import { backendFetch } from '@/lib/backend';

/**
 * CSCA examination follow-up for Business Development (IT change request,
 * Oct 2026).
 */

async function err(res: Response): Promise<string> {
  const b = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return b?.error?.message ?? `Request failed (${res.status}).`;
}

export async function listCscaExams(): Promise<CscaExamRecord[] | null> {
  try {
    const res = await backendFetch('/business-dev/csca-exams?limit=500');
    if (!res.ok) return null;
    const body = (await res.json()) as { items?: CscaExamRecord[] };
    return body.items ?? [];
  } catch {
    return null;
  }
}

export async function saveCscaExam(
  id: string | null,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await backendFetch(
    id ? `/business-dev/csca-exams/${id}` : '/business-dev/csca-exams',
    { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) },
  );
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/business-development');
  return {
    success: true,
    message: id ? 'Sitting updated.' : 'Student registered for CSCA.',
  };
}

/** A dated note, which may also move the sitting's status. */
export async function addCscaFollowUp(
  id: string,
  input: { notes: string; status?: string; nextFollowUp?: string },
): Promise<ActionResult> {
  const res = await backendFetch(
    `/business-dev/csca-exams/${id}/follow-ups`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/business-development');
  return { success: true, message: 'Follow-up logged.' };
}

export async function deleteCscaExam(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/business-dev/csca-exams/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/business-development');
  return { success: true, message: 'Sitting removed.' };
}
