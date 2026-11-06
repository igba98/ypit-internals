'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { backendFetch } from '@/lib/backend';

export async function addStudent(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === 'string' && v !== '') body[k] = v;
  }

  let res: Response;
  try {
    res = await backendFetch('/students', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch {
    return {
      success: false,
      message: 'Unable to reach the server. Please try again.',
    };
  }

  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as {
      error?: { message?: string; fieldErrors?: Record<string, string[]> };
    } | null;
    return {
      success: false,
      message: errBody?.error?.message ?? 'Failed to create student.',
      errors: errBody?.error?.fieldErrors,
    };
  }

  revalidatePath('/students');
  return { success: true, message: 'Student onboarded successfully!' };
}

/** Background details an RO fills in after conversion (system updates 2.0 §2). */
export async function updateStudentBackground(
  studentId: string,
  patch: { previousSchool?: string | null; countryOfOrigin?: string | null },
): Promise<ActionResult> {
  const res = await backendFetch(`/students/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const b = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { success: false, message: b?.error?.message ?? `Request failed (${res.status}).` };
  }
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Saved.' };
}

/**
 * Hand students to a Relations Officer (client report, Nov 2026). Students
 * entered before the RO roles existed carry no officer, and the leads board
 * only covers leads - so IT had no way to allocate them.
 */
export async function allocateStudents(
  studentIds: string[],
  officerId: string | null,
): Promise<ActionResult> {
  const res = await backendFetch('/students/allocate', {
    method: 'POST',
    body: JSON.stringify({ studentIds, officerId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    return {
      success: false,
      message: body?.error?.message ?? `Request failed (${res.status}).`,
    };
  }
  const out = (await res.json()) as { allocated: number; officerName: string | null };
  revalidatePath('/student-leads');
  revalidatePath('/students');
  return {
    success: true,
    message: out.officerName
      ? `${out.allocated} student(s) handed to ${out.officerName}.`
      : `${out.allocated} student(s) set back to unassigned.`,
  };
}
