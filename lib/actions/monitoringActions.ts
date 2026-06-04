'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, CheckIn, WellbeingStatus } from '@/types';
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

function revalidate(opsId: string, studentId?: string) {
  revalidatePath('/monitoring');
  revalidatePath(`/monitoring/${opsId}`);
  if (studentId) revalidatePath(`/students/${studentId}`);
}

export async function createMonitoringRecord(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    studentId: formStr(formData, 'studentId'),
    university: formStr(formData, 'university'),
    country: formStr(formData, 'country'),
    arrivalDate: formStr(formData, 'arrivalDate'),
    accommodationAddress: formStr(formData, 'accommodationAddress'),
    localContactName: formStr(formData, 'localContactName'),
    localContactPhone: formStr(formData, 'localContactPhone'),
    notes: formStr(formData, 'notes'),
  };
  const res = await backendFetch('/monitoring', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/monitoring');
  return { success: true, message: 'Monitoring record opened.' };
}

export async function updateMonitoringRecord(
  opsId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  for (const f of [
    'university',
    'country',
    'arrivalDate',
    'accommodationAddress',
    'localContactName',
    'localContactPhone',
    'notes',
  ] as const) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }
  const res = await backendFetch(`/monitoring/${opsId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const after = (await res.json()) as { studentId?: string };
  revalidate(opsId, after.studentId);
  return { success: true, message: 'Monitoring record updated.' };
}

export async function recordWellnessCheckIn(
  opsId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const wellbeingStatus = formStr(formData, 'wellbeingStatus') as WellbeingStatus | undefined;
  const notes = formStr(formData, 'notes');
  if (!wellbeingStatus || !notes) {
    return { success: false, message: 'Wellbeing status and notes are required.' };
  }
  const res = await backendFetch(`/monitoring/${opsId}/check-ins`, {
    method: 'POST',
    body: JSON.stringify({ wellbeingStatus, notes }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const after = (await res.json()) as { record: { studentId: string } };
  revalidate(opsId, after.record.studentId);
  return { success: true, message: 'Check-in logged.' };
}

export async function listCheckIns(opsId: string): Promise<CheckIn[]> {
  const res = await backendFetch(`/monitoring/${opsId}/check-ins`);
  if (!res.ok) return [];
  return (await res.json()) as CheckIn[];
}

export async function escalateMonitoring(
  opsId: string,
  reason: string,
  studentId?: string,
): Promise<ActionResult> {
  if (!reason || !reason.trim()) {
    return { success: false, message: 'Escalation reason is required.' };
  }
  const res = await backendFetch(`/monitoring/${opsId}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate(opsId, studentId);
  return { success: true, message: 'Escalation logged.' };
}

export async function deEscalateMonitoring(
  opsId: string,
  studentId?: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/monitoring/${opsId}/de-escalate`, { method: 'POST' });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate(opsId, studentId);
  return { success: true, message: 'Escalation cleared.' };
}

export async function confirmEnrollment(
  opsId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const enrollmentDate = formStr(formData, 'enrollmentDate');
  const studentIdNumber = formStr(formData, 'studentIdNumber');
  if (!enrollmentDate) {
    return { success: false, message: 'Enrollment date is required.' };
  }
  const res = await backendFetch(`/monitoring/${opsId}/confirm-enrollment`, {
    method: 'POST',
    body: JSON.stringify({ enrollmentDate, studentIdNumber }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const after = (await res.json()) as { studentId?: string };
  revalidate(opsId, after.studentId);
  return { success: true, message: 'Enrollment confirmed.' };
}
