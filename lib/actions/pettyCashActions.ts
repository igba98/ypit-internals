'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { mockPettyCash, getPettyCashBalance } from '../mock/mockPettyCash';
import { pettyCashExpenseSchema, pettyCashReplenishSchema } from '../validations/finance';
import { ActionResult, PettyCashTransaction } from '@/types';

function nextPettyCashId(): string {
  const year = new Date().getFullYear();
  const max = mockPettyCash
    .filter(t => t.id.startsWith(`PC-${year}-`))
    .reduce((m, t) => {
      const n = parseInt(t.id.split('-')[2] ?? '0', 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
  return `PC-${year}-${String(max + 1).padStart(4, '0')}`;
}

function nextVoucherNumber(): string {
  const year = new Date().getFullYear();
  const expenseCount = mockPettyCash.filter(
    t => t.type === 'EXPENSE' && t.voucherNumber?.startsWith(`PV-${year}-`) && !t.voucherNumber.includes('REPL') && !t.voucherNumber.includes('INIT'),
  ).length;
  return `PV-${year}-${String(expenseCount + 1).padStart(3, '0')}`;
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

export async function recordPettyCashExpense(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  const parsed = pettyCashExpenseSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the validation errors.',
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const v = parsed.data;
  const balance = getPettyCashBalance();
  if (v.amount > balance) {
    return {
      success: false,
      message: `Insufficient float (current balance TZS ${balance.toLocaleString()}). Replenish first.`,
    };
  }
  const user = await currentUser();
  const newBalance = balance - v.amount;

  const tx: PettyCashTransaction = {
    id: nextPettyCashId(),
    date: new Date(v.date).toISOString(),
    type: 'EXPENSE',
    category: v.category,
    description: v.description,
    amount: v.amount,
    currency: 'TZS',
    recipient: v.recipient,
    voucherNumber: v.voucherNumber || nextVoucherNumber(),
    balanceAfter: newBalance,
    recordedById: user?.userId,
    recordedByName: user?.fullName,
    notes: v.notes,
  };

  mockPettyCash.push(tx);

  revalidatePath('/finance');
  revalidatePath('/finance/petty-cash');

  return { success: true, message: `Voucher ${tx.voucherNumber} recorded. Balance: TZS ${newBalance.toLocaleString()}.` };
}

export async function replenishPettyCash(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  const parsed = pettyCashReplenishSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the validation errors.',
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const v = parsed.data;
  const user = await currentUser();
  const newBalance = getPettyCashBalance() + v.amount;

  const tx: PettyCashTransaction = {
    id: nextPettyCashId(),
    date: new Date(v.date).toISOString(),
    type: 'REPLENISHMENT',
    description: 'Replenishment from bank',
    amount: v.amount,
    currency: 'TZS',
    voucherNumber: v.voucherNumber || `PV-${new Date().getFullYear()}-REPL-${String(Math.floor(Math.random() * 90) + 10)}`,
    balanceAfter: newBalance,
    recordedById: user?.userId,
    recordedByName: user?.fullName,
    notes: v.notes,
  };

  mockPettyCash.push(tx);

  revalidatePath('/finance');
  revalidatePath('/finance/petty-cash');

  return { success: true, message: `Float replenished. Balance: TZS ${newBalance.toLocaleString()}.` };
}
