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

function revalidate() {
  revalidatePath('/finance/cash-book');
  revalidatePath('/finance/reconciliation');
  revalidatePath('/finance');
}

export async function addManualCashBookEntry(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    date: formStr(formData, 'date'),
    type: formStr(formData, 'type'),
    description: formStr(formData, 'description'),
    reference: formStr(formData, 'reference'),
    paymentMethod: formStr(formData, 'paymentMethod'),
    amount: Number(formData.get('amount') ?? 0),
    currency: formStr(formData, 'currency') ?? 'TZS',
  };
  const res = await backendFetch('/finance/cashbook', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: 'Entry added to cash book.' };
}

export async function reconcileCashBookEntry(
  entryId: string,
  bankStatementRef?: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/finance/cashbook/${entryId}/reconcile`, {
    method: 'POST',
    body: JSON.stringify(bankStatementRef ? { bankStatementRef } : {}),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: 'Entry reconciled.' };
}

export async function unreconcileCashBookEntry(entryId: string): Promise<ActionResult> {
  const res = await backendFetch(`/finance/cashbook/${entryId}/unreconcile`, {
    method: 'POST',
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: 'Entry un-reconciled.' };
}

export async function createBankReconciliation(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    statementDate: formStr(formData, 'statementDate'),
    statementBalance: Number(formData.get('statementBalance') ?? 0),
    notes: formStr(formData, 'notes'),
  };
  const res = await backendFetch('/finance/cashbook/reconciliations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: 'Bank reconciliation saved.' };
}
