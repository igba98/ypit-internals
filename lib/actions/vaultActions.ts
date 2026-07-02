'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, CredentialCategory } from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return body?.error?.message ?? `Request failed (${res.status}).`;
}

export interface CredentialInput {
  service: string;
  category: CredentialCategory;
  username: string;
  /** Optional on update — omit to keep the stored secret. */
  password?: string;
  url?: string;
  notes?: string;
}

export async function createCredential(
  input: CredentialInput,
): Promise<ActionResult> {
  const res = await backendFetch('/vault', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/it-vault');
  return { success: true, message: `Credential "${input.service}" saved.` };
}

export async function updateCredential(
  id: string,
  input: Partial<CredentialInput>,
): Promise<ActionResult> {
  const res = await backendFetch(`/vault/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/it-vault');
  return { success: true, message: 'Credential updated.' };
}

export async function deleteCredential(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/vault/${id}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/it-vault');
  return { success: true, message: 'Credential deleted.' };
}

/** Decrypts one secret server-side. Every call is audit-logged by the backend. */
export async function revealCredential(
  id: string,
): Promise<ActionResult & { password?: string }> {
  const res = await backendFetch(`/vault/${id}/reveal`, { method: 'POST' });
  if (!res.ok) return { success: false, message: await readError(res) };
  const body = (await res.json()) as { password: string };
  return { success: true, message: 'Revealed.', password: body.password };
}
