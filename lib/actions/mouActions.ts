'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, MouStatus } from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return body?.error?.message ?? `Request failed (${res.status}).`;
}

export interface MouInput {
  title: string;
  universityId?: string;
  partnerName?: string;
  description?: string;
  signedDate?: string;
  effectiveDate?: string;
  expiryDate?: string;
  status: MouStatus;
}

export async function createMou(
  input: MouInput,
): Promise<ActionResult & { mouId?: string }> {
  const res = await backendFetch('/mous', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  const body = (await res.json()) as { id: string };
  revalidatePath('/mous');
  return { success: true, message: `MOU "${input.title}" created.`, mouId: body.id };
}

export async function updateMou(
  id: string,
  input: Partial<MouInput>,
): Promise<ActionResult> {
  const res = await backendFetch(`/mous/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/mous');
  return { success: true, message: 'MOU updated.' };
}

export async function deleteMou(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/mous/${id}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/mous');
  return { success: true, message: 'MOU deleted.' };
}

export interface MouUploadTicket {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export async function requestMouUploadUrl(
  id: string,
  input: { originalName: string; mimeType: string; sizeBytes: number },
): Promise<ActionResult & { ticket?: MouUploadTicket }> {
  const res = await backendFetch(`/mous/${id}/upload-url`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  const ticket = (await res.json()) as MouUploadTicket;
  return { success: true, message: 'Upload URL issued.', ticket };
}

export async function finalizeMouUpload(
  id: string,
  storageKey: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/mous/${id}/finalize`, {
    method: 'POST',
    body: JSON.stringify({ storageKey }),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/mous');
  return { success: true, message: 'Document attached.' };
}

export async function getMouDownloadUrl(
  id: string,
): Promise<ActionResult & { url?: string }> {
  const res = await backendFetch(`/mous/${id}/download-url`);
  if (!res.ok) return { success: false, message: await readError(res) };
  const body = (await res.json()) as { url: string };
  return { success: true, message: 'OK', url: body.url };
}
