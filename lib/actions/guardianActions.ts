'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { backendFetch } from '@/lib/backend';

function coerceBool(v: unknown): boolean {
  return v === true || v === 'on' || v === 'true';
}

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

export async function addGuardian(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const studentId = formData.get('studentId');
  if (typeof studentId !== 'string' || !studentId) {
    return { success: false, message: 'Missing studentId.' };
  }

  const body: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k === 'studentId') continue;
    if (typeof v === 'string' && v !== '') body[k] = v;
  }
  if ('isPrimary' in body) body.isPrimary = coerceBool(body.isPrimary);

  const res = await backendFetch(`/students/${studentId}/guardians`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }

  revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Guardian added.' };
}

export async function deleteGuardian(
  studentId: string,
  guardianId: string,
): Promise<ActionResult> {
  const res = await backendFetch(
    `/students/${studentId}/guardians/${guardianId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Guardian removed.' };
}

export async function setPrimaryGuardian(
  studentId: string,
  guardianId: string,
): Promise<ActionResult> {
  const res = await backendFetch(
    `/students/${studentId}/guardians/${guardianId}/primary`,
    { method: 'PATCH' },
  );
  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }
  const body = (await res.json().catch(() => null)) as {
    fullName?: string;
  } | null;
  revalidatePath(`/students/${studentId}`);
  return {
    success: true,
    message: `${body?.fullName ?? 'Guardian'} is now the primary contact.`,
  };
}
