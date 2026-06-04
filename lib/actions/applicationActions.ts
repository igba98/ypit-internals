'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, ApplicationStatus } from '@/types';
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

export async function createApplication(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    studentId: formStr(formData, 'studentId'),
    university: formStr(formData, 'university'),
    country: formStr(formData, 'country'),
    program: formStr(formData, 'program'),
    level: formStr(formData, 'level'),
    intake: formStr(formData, 'intake'),
  };

  const res = await backendFetch('/applications', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };

  const studentId = String(body.studentId ?? '');
  revalidatePath('/applications');
  if (studentId) revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Application created.' };
}

export async function updateApplication(
  applicationId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  for (const f of [
    'university',
    'country',
    'program',
    'level',
    'intake',
    'offerLetterUrl',
    'conditionsUrl',
    'decisionNotes',
  ] as const) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }

  const res = await backendFetch(`/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  return { success: true, message: 'Application updated.' };
}

/**
 * Pipes a status change through the right transition endpoint:
 *   PREPARING → SUBMITTED       → POST /submit
 *   SUBMITTED → UNDER_REVIEW    → POST /mark-under-review
 *   UNDER_REVIEW → terminal     → POST /decision
 * Edits to status fields directly (PATCH) are disallowed by the backend.
 */
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus | string,
): Promise<ActionResult> {
  let path: string;
  let body: string | undefined;

  switch (newStatus) {
    case 'SUBMITTED':
      path = `/applications/${applicationId}/submit`;
      break;
    case 'UNDER_REVIEW':
      path = `/applications/${applicationId}/mark-under-review`;
      break;
    case 'ACCEPTED':
    case 'REJECTED':
    case 'WAITLISTED':
    case 'DEFERRED':
      path = `/applications/${applicationId}/decision`;
      body = JSON.stringify({ status: newStatus });
      break;
    default:
      return {
        success: false,
        message: `Status ${newStatus} can't be set directly. Use the application form for edits.`,
      };
  }

  const res = await backendFetch(path, { method: 'POST', body });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  return { success: true, message: `Application set to ${String(newStatus).toLowerCase()}.` };
}

export async function recordApplicationDecision(
  applicationId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const status = formStr(formData, 'status');
  if (!status || !['ACCEPTED', 'REJECTED', 'WAITLISTED', 'DEFERRED'].includes(status)) {
    return { success: false, message: 'Choose a decision (Accepted/Rejected/Waitlisted/Deferred).' };
  }
  const body: Record<string, unknown> = { status };
  for (const f of ['offerLetterUrl', 'conditionsUrl', 'decisionNotes'] as const) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }
  const res = await backendFetch(`/applications/${applicationId}/decision`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  return { success: true, message: `Decision recorded: ${status.toLowerCase()}.` };
}

export async function deleteApplication(applicationId: string): Promise<ActionResult> {
  const res = await backendFetch(`/applications/${applicationId}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/applications');
  return { success: true, message: 'Draft application deleted.' };
}
