'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, ExpenseStatus } from '@/types';
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

export async function logExpense(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const category = formStr(formData, 'category');
  const description = formStr(formData, 'description');
  const amountRaw = formStr(formData, 'amount');
  const date = formStr(formData, 'date');
  const paymentMethod = formStr(formData, 'paymentMethod');

  if (!category || !description || !amountRaw || !date || !paymentMethod) {
    return {
      success: false,
      message: 'category, description, amount, date, and paymentMethod are required.',
    };
  }

  const body: Record<string, unknown> = {
    category,
    vendor: formStr(formData, 'vendor'),
    description,
    amount: Number(amountRaw),
    currency: formStr(formData, 'currency') ?? 'TZS',
    date,
    paymentMethod,
    notes: formStr(formData, 'notes'),
    receiptUrl: formStr(formData, 'receiptUrl'),
    receiptFilename: formStr(formData, 'receiptFilename'),
    receiptContentType: formStr(formData, 'receiptContentType'),
  };

  const res = await backendFetch('/finance/expenses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/expenses');
  return { success: true, message: 'Expense logged (PENDING).' };
}

export async function updateExpenseStatus(
  expenseId: string,
  newStatus: ExpenseStatus | string,
): Promise<ActionResult> {
  let path: string;
  let body: string | undefined;
  switch (newStatus) {
    case 'APPROVED':
      path = `/finance/expenses/${expenseId}/approve`;
      break;
    case 'REJECTED':
      path = `/finance/expenses/${expenseId}/reject`;
      body = JSON.stringify({ reason: 'Manually rejected' });
      break;
    case 'PAID':
      path = `/finance/expenses/${expenseId}/mark-paid`;
      body = JSON.stringify({});
      break;
    default:
      return {
        success: false,
        message: `Status ${newStatus} can't be set directly.`,
      };
  }
  const res = await backendFetch(path, { method: 'POST', body });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/expenses');
  return { success: true, message: `Expense marked ${newStatus.toLowerCase()}.` };
}
