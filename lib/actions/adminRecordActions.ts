'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, AdminDocument, CompanyAsset } from '@/types';
import { backendFetch } from '@/lib/backend';

async function err(res: Response): Promise<string> {
  const b = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return b?.error?.message ?? `Request failed (${res.status}).`;
}

// ── Assets ──
export async function listAssets(): Promise<{ items: CompanyAsset[]; equipment: { status: string; _count: number }[] } | null> {
  try {
    const res = await backendFetch('/assets');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveAsset(id: string | null, input: Record<string, unknown>): Promise<ActionResult> {
  const res = await backendFetch(id ? `/assets/${id}` : '/assets', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/assets');
  return { success: true, message: id ? 'Asset updated.' : 'Asset registered.' };
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/assets/${id}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/assets');
  return { success: true, message: 'Asset removed.' };
}

// ── Records ──
export async function listRecords(): Promise<AdminDocument[] | null> {
  try {
    const res = await backendFetch('/records');
    if (!res.ok) return null;
    return ((await res.json()) as { items: AdminDocument[] }).items ?? [];
  } catch {
    return null;
  }
}

export async function saveRecord(id: string | null, input: Record<string, unknown>): Promise<ActionResult & { recordId?: string }> {
  const res = await backendFetch(id ? `/records/${id}` : '/records', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) });
  if (!res.ok) return { success: false, message: await err(res) };
  const row = (await res.json()) as { id: string };
  revalidatePath('/records');
  return { success: true, message: id ? 'Record updated.' : 'Record filed.', recordId: row.id };
}

export async function deleteRecord(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/records/${id}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/records');
  return { success: true, message: 'Record deleted.' };
}

export async function requestRecordUpload(
  id: string,
  input: { originalName: string; mimeType: string; sizeBytes: number },
): Promise<ActionResult & { ticket?: { uploadUrl: string; storageKey: string } }> {
  const res = await backendFetch(`/records/${id}/upload-url`, { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) return { success: false, message: await err(res) };
  return { success: true, message: 'OK', ticket: await res.json() };
}

export async function finalizeRecordUpload(id: string, storageKey: string): Promise<ActionResult> {
  const res = await backendFetch(`/records/${id}/finalize`, { method: 'POST', body: JSON.stringify({ storageKey }) });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/records');
  return { success: true, message: 'File attached.' };
}

export async function recordDownloadUrl(id: string): Promise<ActionResult & { url?: string }> {
  const res = await backendFetch(`/records/${id}/download-url`);
  if (!res.ok) return { success: false, message: await err(res) };
  return { success: true, message: 'OK', url: ((await res.json()) as { url: string }).url };
}
