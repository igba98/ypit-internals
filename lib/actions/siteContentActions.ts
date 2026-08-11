'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return body?.error?.message ?? `Request failed (${res.status}).`;
}

export interface SiteContentRow {
  id: string;
  key: string;
  type: 'TEXT' | 'IMAGE';
  value?: string | null;
  storageKey?: string | null;
  resolvedValue?: string | null;
  updatedByName?: string | null;
  updatedAt: string;
}

export async function listSiteContent(): Promise<SiteContentRow[]> {
  try {
    const res = await backendFetch('/site-content');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: SiteContentRow[] };
    return body.items ?? [];
  } catch {
    return [];
  }
}

/** Save text (or an external image URL) into a slot. */
export async function setSiteSlot(
  key: string,
  type: 'TEXT' | 'IMAGE',
  value: string | null,
): Promise<ActionResult> {
  const res = await backendFetch(`/site-content/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ type, value }),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/website-cms');
  return { success: true, message: 'Saved. The website updates within a minute.' };
}

/** Remove the override so the website falls back to its built-in default. */
export async function resetSiteSlot(key: string): Promise<ActionResult> {
  const res = await backendFetch(`/site-content/${key}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/website-cms');
  return { success: true, message: 'Reset to the default.' };
}

export interface SlotUploadTicket {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export async function requestSlotUploadUrl(
  key: string,
  input: { originalName: string; mimeType: string; sizeBytes: number },
): Promise<ActionResult & { ticket?: SlotUploadTicket }> {
  const res = await backendFetch(`/site-content/${key}/upload-url`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  return {
    success: true,
    message: 'OK',
    ticket: (await res.json()) as SlotUploadTicket,
  };
}

export async function finalizeSlotUpload(
  key: string,
  storageKey: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/site-content/${key}/finalize`, {
    method: 'POST',
    body: JSON.stringify({ storageKey }),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/website-cms');
  return {
    success: true,
    message: 'Image published. The website updates within a minute.',
  };
}
