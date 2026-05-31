'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response) {
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

export async function recordPettyCashExpense(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const description = formStr(formData, 'description');
  const amountRaw = formStr(formData, 'amount');
  const category = formStr(formData, 'category');
  if (!description || !amountRaw || !category) {
    return {
      success: false,
      message: 'description, amount, and category are required.',
    };
  }

  const body: Record<string, unknown> = {
    type: 'EXPENSE',
    category,
    description,
    amount: Number(amountRaw),
    currency: formStr(formData, 'currency') ?? 'TZS',
    date: formStr(formData, 'date'),
    recipient: formStr(formData, 'recipient'),
    voucherNumber: formStr(formData, 'voucherNumber'),
    notes: formStr(formData, 'notes'),
    receiptUrl: formStr(formData, 'receiptUrl'),
    receiptFilename: formStr(formData, 'receiptFilename'),
    receiptContentType: formStr(formData, 'receiptContentType'),
  };

  const res = await backendFetch('/finance/petty-cash', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/petty-cash');
  return { success: true, message: 'Petty cash expense recorded.' };
}

export async function replenishPettyCash(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const description = formStr(formData, 'description');
  const amountRaw = formStr(formData, 'amount');
  if (!description || !amountRaw) {
    return { success: false, message: 'description and amount are required.' };
  }
  const isInitial = formStr(formData, 'type') === 'INITIAL_FLOAT';

  const body: Record<string, unknown> = {
    type: isInitial ? 'INITIAL_FLOAT' : 'REPLENISHMENT',
    description,
    amount: Number(amountRaw),
    currency: formStr(formData, 'currency') ?? 'TZS',
    date: formStr(formData, 'date'),
    notes: formStr(formData, 'notes'),
  };

  const res = await backendFetch('/finance/petty-cash', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/petty-cash');
  return {
    success: true,
    message: isInitial ? 'Initial float recorded.' : 'Petty cash replenished.',
  };
}
