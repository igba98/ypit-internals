'use server';

import { revalidatePath } from 'next/cache';
import { mockFeeLedgers, getFeeLedgerForStudent } from '../mock/mockFeeLedgers';
import { mockAuditLogs } from '../mock/mockAuditLogs';
import { ActionResult, FeeLineStatus } from '@/types';
import { overrideFeeLineSchema } from '../validations/catalog';

const STATUSES: FeeLineStatus[] = ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED'];

function logFeeLedger(action: 'UPDATE', detail: string, studentId: string, previousValue?: string, newValue?: string) {
  mockAuditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: 'usr_system',
    userName: 'System',
    userRole: 'FINANCE',
    action,
    module: 'FEE_LEDGER',
    detail,
    entityId: studentId,
    entityType: 'StudentFeeLedger',
    previousValue,
    newValue,
    timestamp: new Date().toISOString(),
  });
}

export async function updateFeeLineStatus(
  studentId: string,
  lineId: string,
  newStatus: string,
): Promise<ActionResult> {
  if (!STATUSES.includes(newStatus as FeeLineStatus)) {
    return { success: false, message: 'Invalid status.' };
  }
  const ledger = getFeeLedgerForStudent(studentId);
  if (!ledger) return { success: false, message: 'No fee ledger found for this student.' };
  const line = ledger.lines.find(l => l.id === lineId);
  if (!line) return { success: false, message: 'Fee line not found.' };

  const before = line.status;
  line.status = newStatus as FeeLineStatus;
  ledger.updatedAt = new Date().toISOString();
  logFeeLedger('UPDATE', `Fee line status ${before} → ${newStatus}`, studentId, before, newStatus);

  revalidatePath('/payments');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/finance');
  return { success: true, message: `Status updated to ${newStatus.toLowerCase()}.` };
}

export async function overrideFeeLine(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = overrideFeeLineSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors };
  }
  const { studentId, lineId, amount, currency, dueDate, reason } = parsed.data;

  const ledger = getFeeLedgerForStudent(studentId);
  if (!ledger) return { success: false, message: 'No fee ledger found.' };
  const line = ledger.lines.find(l => l.id === lineId);
  if (!line) return { success: false, message: 'Fee line not found.' };

  if (line.status === 'PAID') {
    return { success: false, message: 'Cannot override a paid line.' };
  }

  const before = JSON.stringify(line);
  if (amount !== undefined) line.amount = amount;
  if (currency !== undefined) line.currency = currency;
  if (dueDate !== undefined) line.dueDate = dueDate;
  line.overrideReason = reason;
  line.overriddenById = 'usr_current';
  line.overriddenByName = 'Finance';
  line.overriddenAt = new Date().toISOString();
  ledger.updatedAt = new Date().toISOString();
  logFeeLedger('UPDATE', `Fee line overridden — reason: ${reason}`, studentId, before, JSON.stringify(line));

  revalidatePath('/payments');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/finance');
  return { success: true, message: 'Fee line overridden.' };
}
