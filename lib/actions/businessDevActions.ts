'use server';

import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  BdEventStatus,
  BdEventType,
  PartnershipStatus,
} from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return body?.error?.message ?? `Request failed (${res.status}).`;
}

export interface BdEventInput {
  name: string;
  type: BdEventType;
  venue?: string;
  eventDate: string;
  endDate?: string;
  budget?: number;
  status: BdEventStatus;
  description?: string;
  outcomes?: string;
  leadsGenerated?: number;
}

export async function createBdEvent(input: BdEventInput): Promise<ActionResult> {
  const res = await backendFetch('/business-dev/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/business-development');
  return { success: true, message: `Event "${input.name}" created.` };
}

export async function updateBdEvent(
  id: string,
  input: Partial<BdEventInput>,
): Promise<ActionResult> {
  const res = await backendFetch(`/business-dev/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/business-development');
  return { success: true, message: 'Event updated.' };
}

export async function deleteBdEvent(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/business-dev/events/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/business-development');
  return { success: true, message: 'Event deleted.' };
}

export async function upsertPartnership(
  universityId: string,
  input: {
    status: PartnershipStatus;
    commissionTerms?: string | null;
    notes?: string | null;
    lastContactAt?: string | null;
  },
): Promise<ActionResult> {
  const res = await backendFetch(`/business-dev/partnerships/${universityId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/business-development');
  return { success: true, message: 'Partnership saved.' };
}

export async function logPartnershipFollowUp(
  universityId: string,
  notes: string,
): Promise<ActionResult> {
  const res = await backendFetch(
    `/business-dev/partnerships/${universityId}/follow-ups`,
    { method: 'POST', body: JSON.stringify({ notes }) },
  );
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/business-development');
  return { success: true, message: 'Follow-up logged.' };
}
