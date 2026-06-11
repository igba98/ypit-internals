'use server';

import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  PassportStatus,
  TravelStatus,
  VisaStatus,
} from '@/types';
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

function revalidate(studentId?: string) {
  revalidatePath('/travel');
  if (studentId) revalidatePath(`/students/${studentId}`);
}

async function patchTravel(travelId: string, body: Record<string, unknown>): Promise<ActionResult & { studentId?: string }> {
  const res = await backendFetch(`/travel/${travelId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const after = (await res.json()) as { studentId?: string };
  return { success: true, message: 'Updated.', studentId: after.studentId };
}

export async function updateTravelStatus(
  travelId: string,
  newStatus: TravelStatus | string,
): Promise<ActionResult> {
  const allowed: TravelStatus[] = ['PLANNING', 'VISA_PENDING', 'READY', 'TRAVELLED'];
  if (!allowed.includes(newStatus as TravelStatus)) {
    return { success: false, message: 'Invalid travel status.' };
  }
  const res = await patchTravel(travelId, { travelStatus: newStatus });
  if (!res.success) return res;
  revalidate(res.studentId);
  return { success: true, message: `Travel marked as ${String(newStatus).replace(/_/g, ' ').toLowerCase()}.` };
}

export async function updateVisaStatus(
  travelId: string,
  newStatus: VisaStatus | string,
): Promise<ActionResult> {
  const allowed: VisaStatus[] = [
    'NOT_STARTED',
    'DOCUMENTS_GATHERING',
    'APPLIED',
    'APPOINTMENT_BOOKED',
    'APPROVED',
    'REJECTED',
    'APPEALING',
  ];
  if (!allowed.includes(newStatus as VisaStatus)) {
    return { success: false, message: 'Invalid visa status.' };
  }
  const body: Record<string, unknown> = { visaStatus: newStatus };
  const today = new Date().toISOString().slice(0, 10);
  if (newStatus === 'APPROVED') body.visaApprovalDate = today;
  if (newStatus === 'APPLIED') body.visaApplicationDate = today;

  const res = await patchTravel(travelId, body);
  if (!res.success) return res;
  revalidate(res.studentId);
  return { success: true, message: `Visa marked as ${String(newStatus).replace(/_/g, ' ').toLowerCase()}.` };
}

export async function updatePassportStatus(
  travelId: string,
  newStatus: PassportStatus | string,
): Promise<ActionResult> {
  const allowed: PassportStatus[] = ['HAS_PASSPORT', 'APPLYING', 'READY'];
  if (!allowed.includes(newStatus as PassportStatus)) {
    return { success: false, message: 'Invalid passport status.' };
  }
  const res = await patchTravel(travelId, { passportStatus: newStatus });
  if (!res.success) return res;
  revalidate(res.studentId);
  return { success: true, message: `Passport marked as ${String(newStatus).replace(/_/g, ' ').toLowerCase()}.` };
}

/**
 * Full PATCH from a slide-in edit form. Pulls every editable field that's
 * present in the FormData and forwards to the backend. Empty strings become
 * `null` so they actually clear the field.
 */
export async function updateTravelRecord(
  travelId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const stringFields = [
    'passportNumber',
    'visaType',
    'flightNumber',
    'airline',
    'departureCity',
    'destinationCity',
    'destinationAirport',
    'pickupContactName',
    'pickupContactPhone',
    'accommodationAddress',
  ] as const;
  const dateFields = [
    'passportExpiry',
    'visaApplicationDate',
    'visaAppointmentDate',
    'visaApprovalDate',
    'visaExpiryDate',
    'flightDate',
  ] as const;
  const enumFields: Array<[string, readonly string[]]> = [
    ['passportStatus', ['HAS_PASSPORT', 'APPLYING', 'READY']],
    ['visaStatus', ['NOT_STARTED', 'DOCUMENTS_GATHERING', 'APPLIED', 'APPOINTMENT_BOOKED', 'APPROVED', 'REJECTED', 'APPEALING']],
    ['travelStatus', ['PLANNING', 'VISA_PENDING', 'READY', 'TRAVELLED']],
  ];

  const body: Record<string, unknown> = {};
  for (const f of stringFields) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }
  for (const f of dateFields) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }
  for (const [f, allowed] of enumFields) {
    const v = formStr(formData, f);
    if (v && allowed.includes(v)) body[f] = v;
  }

  const pickup = formData.get('airportPickupArranged');
  if (pickup !== null) {
    body.airportPickupArranged = pickup === 'on' || pickup === 'true';
  }

  const res = await patchTravel(travelId, body);
  if (!res.success) return res;
  revalidate(res.studentId);
  return { success: true, message: 'Travel record updated.' };
}

/**
 * Advances a single pipeline sub-step. Delegates to the Phase 6 endpoint:
 *   POST /students/:studentId/travel-steps/:step
 * The body schema is dynamic per step (passport/visa/flight/arrival) - pass
 * whatever the step expects (e.g. { passportNumber }, { decision: 'APPROVED' }).
 */
export async function advanceTravelStep(
  studentId: string,
  step: 'passport' | 'visa' | 'flight' | 'arrival',
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await backendFetch(`/students/${studentId}/travel-steps/${step}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate(studentId);
  return { success: true, message: `${step} step advanced.` };
}
