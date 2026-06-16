'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, StudentFollowUp } from '@/types';
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

export async function listStudentFollowUps(studentId: string): Promise<StudentFollowUp[]> {
  const res = await backendFetch(`/students/${studentId}/follow-ups`);
  if (!res.ok) return [];
  const body = (await res.json()) as { items: StudentFollowUp[] };
  return body.items ?? [];
}

export async function addStudentFollowUp(
  studentId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const notes = formStr(formData, 'notes');
  if (!notes) return { success: false, message: 'Notes are required.' };

  const body: Record<string, unknown> = {
    type: formStr(formData, 'type') ?? 'NOTE',
    outcome: formStr(formData, 'outcome') ?? 'NEUTRAL',
    notes,
  };
  const nextFollowUp = formStr(formData, 'nextFollowUp');
  if (nextFollowUp) body.nextFollowUp = nextFollowUp;

  const res = await backendFetch(`/students/${studentId}/follow-ups`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Follow-up logged.' };
}
