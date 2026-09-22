'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, CommissionLedger } from '@/types';
import { backendFetch } from '@/lib/backend';

async function err(res: Response): Promise<string> {
  const b = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return b?.error?.message ?? `Request failed (${res.status}).`;
}

export async function listCommissions(universityId?: string): Promise<CommissionLedger | null> {
  try {
    const q = universityId ? `?universityId=${encodeURIComponent(universityId)}` : '';
    const res = await backendFetch(`/commissions${q}`);
    if (!res.ok) return null;
    return (await res.json()) as CommissionLedger;
  } catch {
    return null;
  }
}

export interface CommissionInput {
  universityId: string;
  studentId?: string | null;
  intake?: string;
  amount: number;
  currency: string;
  status: string;
  dueDate?: string | null;
  reference?: string;
  notes?: string;
}

export async function saveCommission(id: string | null, input: CommissionInput): Promise<ActionResult> {
  const res = await backendFetch(id ? `/commissions/${id}` : '/commissions', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/commissions');
  return { success: true, message: id ? 'Commission updated.' : 'Commission recorded.' };
}

export async function setCommissionStatus(id: string, status: string): Promise<ActionResult> {
  const res = await backendFetch(`/commissions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/commissions');
  return { success: true, message: `Marked ${status.toLowerCase()}.` };
}

export async function deleteCommission(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/commissions/${id}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, message: await err(res) };
  revalidatePath('/commissions');
  return { success: true, message: 'Commission deleted.' };
}
