'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { mockExpenses } from '../mock/mockExpenses';
import { expenseSchema } from '../validations/finance';
import { ActionResult, Expense, ExpenseStatus } from '@/types';

const EXPENSE_STATUSES: ExpenseStatus[] = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'];

function nextExpenseId(): string {
  const year = new Date().getFullYear();
  const max = mockExpenses
    .filter(e => e.id.startsWith(`EXP-${year}-`))
    .reduce((m, e) => {
      const n = parseInt(e.id.split('-')[2] ?? '0', 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
  return `EXP-${year}-${String(max + 1).padStart(4, '0')}`;
}

async function currentUser() {
  const c = await cookies();
  const cookie = c.get('ypit_session');
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value) as { userId: string; fullName: string };
  } catch {
    return null;
  }
}

export async function logExpense(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the validation errors.',
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const v = parsed.data;
  const user = await currentUser();

  const expense: Expense = {
    id: nextExpenseId(),
    category: v.category,
    vendor: v.vendor,
    description: v.description,
    amount: v.amount,
    currency: 'TZS',
    date: new Date(v.date).toISOString(),
    paymentMethod: v.paymentMethod,
    status: 'PENDING',
    notes: v.notes,
    receiptUrl: v.receiptUrl || undefined,
    receiptFilename: v.receiptFilename || undefined,
    receiptContentType: v.receiptContentType || undefined,
    recordedById: user?.userId,
    recordedByName: user?.fullName,
    createdAt: new Date().toISOString(),
  };

  mockExpenses.unshift(expense);

  revalidatePath('/finance');
  revalidatePath('/finance/expenses');

  return { success: true, message: `Expense ${expense.id} logged for approval.` };
}

export async function updateExpenseStatus(expenseId: string, newStatus: string): Promise<ActionResult> {
  if (!EXPENSE_STATUSES.includes(newStatus as ExpenseStatus)) {
    return { success: false, message: 'Invalid expense status.' };
  }
  const exp = mockExpenses.find(e => e.id === expenseId);
  if (!exp) return { success: false, message: 'Expense not found.' };

  const user = await currentUser();
  exp.status = newStatus as ExpenseStatus;

  if (newStatus === 'APPROVED' && !exp.approvedById) {
    exp.approvedById = user?.userId;
    exp.approvedByName = user?.fullName;
  }
  if (newStatus === 'PAID' && !exp.paidDate) {
    exp.paidDate = new Date().toISOString();
  }
  if (newStatus === 'REJECTED') {
    exp.approvedById = user?.userId;
    exp.approvedByName = user?.fullName;
  }

  revalidatePath('/finance');
  revalidatePath('/finance/expenses');

  return { success: true, message: `Expense marked as ${newStatus.toLowerCase()}.` };
}
