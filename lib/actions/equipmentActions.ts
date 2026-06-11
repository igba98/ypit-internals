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

function revalidate(staffId?: string) {
  revalidatePath('/equipment');
  if (staffId) revalidatePath(`/staff/${staffId}`);
}

export async function issueEquipment(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const staffId = formStr(formData, 'staffId');
  const body: Record<string, unknown> = {
    staffId,
    name: formStr(formData, 'name'),
    category: formStr(formData, 'category'),
    serialNumber: formStr(formData, 'serialNumber'),
    description: formStr(formData, 'description'),
    conditionOut: formStr(formData, 'conditionOut') ?? 'GOOD',
    issuedAt: formStr(formData, 'issuedAt'),
    notes: formStr(formData, 'notes'),
  };
  const res = await backendFetch('/equipment', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate(staffId);
  return { success: true, message: 'Equipment issued.' };
}

export async function returnEquipment(
  assignmentId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    conditionIn: formStr(formData, 'conditionIn'),
    faultNotes: formStr(formData, 'faultNotes'),
    returnedAt: formStr(formData, 'returnedAt'),
  };
  const res = await backendFetch(`/equipment/${assignmentId}/return`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const after = (await res.json()) as { staffId?: string };
  revalidate(after.staffId);
  return { success: true, message: 'Return recorded.' };
}

export async function markEquipmentLost(
  assignmentId: string,
  notes: string,
): Promise<ActionResult> {
  if (!notes || notes.trim().length < 3) {
    return { success: false, message: 'A short note about how it was lost is required.' };
  }
  const res = await backendFetch(`/equipment/${assignmentId}/mark-lost`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes.trim() }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const after = (await res.json()) as { staffId?: string };
  revalidate(after.staffId);
  return { success: true, message: 'Marked as lost.' };
}
