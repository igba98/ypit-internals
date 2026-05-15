'use server';

import { revalidatePath } from 'next/cache';
import { mockPayroll, ROLE_BASE_SALARY } from '../mock/mockPayroll';
import { mockUsers } from '../mock/mockUsers';
import { ActionResult, PayrollEntry, PayrollStatus } from '@/types';

const PAYROLL_STATUSES: PayrollStatus[] = ['DRAFT', 'APPROVED', 'PAID', 'CANCELLED'];

const monthLabel = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const monthCode = (d: Date) =>
  ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()];

const computeNet = (base: number, allowances = 0, deductions = 0) => {
  const gross = base + allowances;
  const tax = Math.max(0, Math.round((gross - 270000) * 0.09));
  const pension = Math.round(base * 0.1);
  const net = gross - tax - pension - deductions;
  return { tax, pension, net };
};

export async function generatePayroll(periodStartISO: string): Promise<ActionResult> {
  const start = new Date(periodStartISO);
  if (Number.isNaN(start.getTime())) {
    return { success: false, message: 'Invalid period.' };
  }
  // Always work on the 1st of that month
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59));
  const period = monthLabel(start);
  const code = monthCode(start);
  const year = start.getUTCFullYear();

  // Skip if already generated
  if (mockPayroll.some(p => p.period === period)) {
    return { success: false, message: `${period} payroll already generated.` };
  }

  const eligible = mockUsers.filter(
    u => u.status === 'ACTIVE' && (ROLE_BASE_SALARY[u.role] ?? 0) > 0,
  );

  let counter = 1;
  for (const staff of eligible) {
    const base = ROLE_BASE_SALARY[staff.role];
    const allowances =
      staff.role === 'MANAGING_DIRECTOR' ? 500000 : staff.role === 'MARKETING_MANAGER' ? 300000 : 150000;
    const { tax, pension, net } = computeNet(base, allowances, 0);
    const entry: PayrollEntry = {
      id: `PR-${year}-${code}-${String(counter).padStart(3, '0')}`,
      staffId: staff.id,
      staffName: staff.fullName,
      staffRole: staff.role,
      department: staff.department,
      period,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      baseSalary: base,
      allowances,
      deductions: 0,
      tax,
      pension,
      netPay: net,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };
    mockPayroll.push(entry);
    counter++;
  }

  revalidatePath('/finance');
  revalidatePath('/finance/payroll');

  return { success: true, message: `${period} payroll generated for ${eligible.length} staff.` };
}

export async function updatePayrollStatus(payrollId: string, newStatus: string): Promise<ActionResult> {
  if (!PAYROLL_STATUSES.includes(newStatus as PayrollStatus)) {
    return { success: false, message: 'Invalid payroll status.' };
  }
  const entry = mockPayroll.find(p => p.id === payrollId);
  if (!entry) return { success: false, message: 'Payroll entry not found.' };

  entry.status = newStatus as PayrollStatus;
  if (newStatus === 'PAID' && !entry.paidDate) {
    entry.paidDate = new Date().toISOString();
    if (!entry.paymentMethod) entry.paymentMethod = 'BANK_TRANSFER';
  }

  revalidatePath('/finance');
  revalidatePath('/finance/payroll');

  return { success: true, message: `${entry.staffName} payroll marked ${newStatus.toLowerCase()}.` };
}

export async function approveAllPayroll(period: string): Promise<ActionResult> {
  const matches = mockPayroll.filter(p => p.period === period && p.status === 'DRAFT');
  if (matches.length === 0) {
    return { success: false, message: 'No draft entries to approve for that period.' };
  }
  for (const e of matches) e.status = 'APPROVED';
  revalidatePath('/finance/payroll');
  return { success: true, message: `Approved ${matches.length} entries for ${period}.` };
}

export async function markAllPaidForPeriod(period: string): Promise<ActionResult> {
  const matches = mockPayroll.filter(p => p.period === period && p.status === 'APPROVED');
  if (matches.length === 0) {
    return { success: false, message: 'No approved entries pending payment for that period.' };
  }
  const now = new Date().toISOString();
  for (const e of matches) {
    e.status = 'PAID';
    e.paidDate = now;
    if (!e.paymentMethod) e.paymentMethod = 'BANK_TRANSFER';
  }
  revalidatePath('/finance/payroll');
  return { success: true, message: `Paid ${matches.length} entries for ${period}.` };
}
