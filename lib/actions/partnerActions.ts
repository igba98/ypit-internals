'use server';

import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  PartnerContractStatus,
  PartnerKind,
  PartnerStatus,
} from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return body?.error?.message ?? `Request failed (${res.status}).`;
}

const BASE: Record<PartnerKind, string> = { SCHOOL: '/schools', COMPANY: '/companies' };

function revalidate(kind: PartnerKind, id?: string) {
  revalidatePath(BASE[kind]);
  if (id) revalidatePath(`${BASE[kind]}/${id}`);
}

export interface PartnerInput {
  name: string;
  category?: string;
  country?: string;
  city?: string;
  address?: string;
  website?: string;
  contactName?: string;
  contactRole?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: PartnerStatus;
  startDate?: string;
  expiryDate?: string;
  notes?: string;
}

export async function createPartner(
  kind: PartnerKind,
  input: PartnerInput,
): Promise<ActionResult & { id?: string }> {
  const res = await backendFetch('/partners', {
    method: 'POST',
    body: JSON.stringify({ kind, ...input }),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  const body = (await res.json()) as { id: string };
  revalidate(kind);
  return { success: true, message: `${input.name} added.`, id: body.id };
}

export async function updatePartner(
  kind: PartnerKind,
  id: string,
  input: Partial<PartnerInput>,
): Promise<ActionResult> {
  const res = await backendFetch(`/partners/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidate(kind, id);
  return { success: true, message: 'Saved.' };
}

export async function deletePartner(kind: PartnerKind, id: string): Promise<ActionResult> {
  const res = await backendFetch(`/partners/${id}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidate(kind);
  return { success: true, message: 'Removed.' };
}

export async function addPartnerFollowUp(
  kind: PartnerKind,
  id: string,
  input: { notes: string; nextActionAt?: string },
): Promise<ActionResult> {
  const res = await backendFetch(`/partners/${id}/follow-ups`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidate(kind, id);
  return { success: true, message: 'Follow-up logged.' };
}

// ── Contracts ──

export interface ContractInput {
  title: string;
  description?: string;
  status: PartnerContractStatus;
  signedDate?: string;
  startDate?: string;
  expiryDate?: string;
}

export async function addContract(
  kind: PartnerKind,
  partnerId: string,
  input: ContractInput,
): Promise<ActionResult & { contractId?: string }> {
  const res = await backendFetch(`/partners/${partnerId}/contracts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  const body = (await res.json()) as { id: string };
  revalidate(kind, partnerId);
  return { success: true, message: `Contract "${input.title}" added.`, contractId: body.id };
}

export async function updateContract(
  kind: PartnerKind,
  partnerId: string,
  contractId: string,
  input: Partial<ContractInput>,
): Promise<ActionResult> {
  const res = await backendFetch(`/partners/${partnerId}/contracts/${contractId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidate(kind, partnerId);
  return { success: true, message: 'Contract updated.' };
}

export async function deleteContract(
  kind: PartnerKind,
  partnerId: string,
  contractId: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/partners/${partnerId}/contracts/${contractId}`, {
    method: 'DELETE',
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidate(kind, partnerId);
  return { success: true, message: 'Contract deleted.' };
}

export interface UploadTicket {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export async function requestContractUploadUrl(
  partnerId: string,
  contractId: string,
  input: { originalName: string; mimeType: string; sizeBytes: number },
): Promise<ActionResult & { ticket?: UploadTicket }> {
  const res = await backendFetch(
    `/partners/${partnerId}/contracts/${contractId}/upload-url`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  if (!res.ok) return { success: false, message: await readError(res) };
  return { success: true, message: 'OK', ticket: (await res.json()) as UploadTicket };
}

export async function finalizeContractUpload(
  kind: PartnerKind,
  partnerId: string,
  contractId: string,
  storageKey: string,
): Promise<ActionResult> {
  const res = await backendFetch(
    `/partners/${partnerId}/contracts/${contractId}/finalize`,
    { method: 'POST', body: JSON.stringify({ storageKey }) },
  );
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidate(kind, partnerId);
  return { success: true, message: 'Document attached.' };
}

export async function getContractDownloadUrl(
  partnerId: string,
  contractId: string,
): Promise<ActionResult & { url?: string }> {
  const res = await backendFetch(
    `/partners/${partnerId}/contracts/${contractId}/download-url`,
  );
  if (!res.ok) return { success: false, message: await readError(res) };
  const body = (await res.json()) as { url: string };
  return { success: true, message: 'OK', url: body.url };
}
