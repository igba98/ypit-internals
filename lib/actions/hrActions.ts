'use server';

import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  Appointment,
  FoodBudget,
  FoodScheduleEntry,
  TrainingSession,
} from '@/types';
import { backendFetch } from '@/lib/backend';

/**
 * HR activities and office administration (IT change request, Oct 2026). The
 * two are kept as separate sections, never one combined list.
 */

async function err(res: Response): Promise<string> {
  const b = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return b?.error?.message ?? `Request failed (${res.status}).`;
}

async function list<T>(path: string): Promise<T[] | null> {
  try {
    const res = await backendFetch(path);
    if (!res.ok) return null;
    const body = (await res.json()) as { items?: T[] };
    return body.items ?? [];
  } catch {
    return null;
  }
}

// ── Training & orientations ──────────────────────────────────────

export async function listTrainings(): Promise<TrainingSession[] | null> {
  return list<TrainingSession>('/hr/trainings?limit=500');
}

export async function saveTraining(
  id: string | null,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await backendFetch(id ? `/hr/trainings/${id}` : '/hr/trainings', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/hr');
  return {
    success: true,
    message: id ? 'Session updated.' : 'Session scheduled.',
  };
}

export async function deleteTraining(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/hr/trainings/${id}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/hr');
  return { success: true, message: 'Session removed.' };
}

// ── Food schedule (ratiba ya chakula) ────────────────────────────

export async function listFoodSchedule(
  from?: string,
  to?: string,
): Promise<FoodScheduleEntry[] | null> {
  const qs = new URLSearchParams({ limit: '500' });
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  return list<FoodScheduleEntry>(`/hr/food-schedule?${qs.toString()}`);
}

/** Posting the same day + meal twice replaces the menu rather than failing. */
export async function saveFoodEntry(
  id: string | null,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await backendFetch(
    id ? `/hr/food-schedule/${id}` : '/hr/food-schedule',
    { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) },
  );
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/hr');
  return { success: true, message: id ? 'Menu updated.' : 'Menu saved.' };
}

export async function deleteFoodEntry(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/hr/food-schedule/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/hr');
  return { success: true, message: 'Menu removed.' };
}

// ── Monthly food budget ──────────────────────────────────────────

export async function listFoodBudgets(): Promise<FoodBudget[] | null> {
  return list<FoodBudget>('/hr/food-budget');
}

export async function saveFoodBudget(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await backendFetch('/hr/food-budget', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/hr');
  return { success: true, message: 'Budget saved.' };
}

// ── Administration: appointment calendar ─────────────────────────

export async function listAppointments(
  from?: string,
  to?: string,
): Promise<Appointment[] | null> {
  const qs = new URLSearchParams({ limit: '500' });
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  return list<Appointment>(`/administration/appointments?${qs.toString()}`);
}

export async function saveAppointment(
  id: string | null,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await backendFetch(
    id ? `/administration/appointments/${id}` : '/administration/appointments',
    { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) },
  );
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/administration');
  return { success: true, message: id ? 'Appointment updated.' : 'Appointment booked.' };
}

export async function deleteAppointment(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/administration/appointments/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/administration');
  return { success: true, message: 'Appointment removed.' };
}
