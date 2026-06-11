'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response): Promise<{
  message: string;
  errors?: Record<string, string[]>;
}> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string; fieldErrors?: Record<string, string[]> };
  } | null;
  return {
    message: body?.error?.message ?? `Request failed (${res.status}).`,
    errors: body?.error?.fieldErrors,
  };
}

function formStr(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function revalidate(subAgentId: string) {
  revalidatePath('/subagents');
  revalidatePath(`/subagents/${subAgentId}`);
}

export async function upsertSubAgentContract(
  subAgentId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  const status = formStr(formData, 'status');
  if (status) body.status = status;
  for (const f of ['startDate', 'endDate', 'signedAt'] as const) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }
  const target = formData.get('studentTarget');
  if (target !== null && target !== '') body.studentTarget = Number(target);
  const commissionTerms = formStr(formData, 'commissionTerms');
  if (commissionTerms !== undefined) body.commissionTerms = commissionTerms;
  const notes = formStr(formData, 'notes');
  if (notes !== undefined) body.notes = notes;

  const res = await backendFetch(`/subagents/${subAgentId}/contract`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate(subAgentId);
  return { success: true, message: 'Contract saved.' };
}

export async function logSubAgentFollowUp(
  subAgentId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const notes = formStr(formData, 'notes');
  if (!notes) return { success: false, message: 'Follow-up notes are required.' };

  const res = await backendFetch(`/subagents/${subAgentId}/follow-ups`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate(subAgentId);
  return { success: true, message: 'Follow-up logged.' };
}
