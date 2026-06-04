'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, PayrollStatus, Role } from '@/types';
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

const DEFAULT_BASE_SALARY = 500_000;
const PERIOD_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

interface StaffMember {
  id: string;
  fullName: string;
  role: Role;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  baseSalary?: number | null;
}

/**
 * "Generate payroll" - fetches all ACTIVE staff and creates one DRAFT row per
 * person. Uses each staff member's stored monthly baseSalary if set; falls back
 * to the placeholder otherwise. Finance can still edit per-row before approving.
 * Duplicates (same staff + period) silently skip thanks to the unique
 * constraint on the backend.
 */
export async function generatePayroll(
  periodStartISO: string,
): Promise<ActionResult> {
  const start = new Date(periodStartISO);
  if (Number.isNaN(start.getTime())) {
    return { success: false, message: 'Invalid period start date.' };
  }
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const period = PERIOD_LABEL_FORMATTER.format(start);

  const staffRes = await backendFetch('/staff?status=ACTIVE&limit=100');
  if (!staffRes.ok) return { success: false, ...(await readError(staffRes)) };
  const staffBody = (await staffRes.json()) as { items: StaffMember[] };
  const active = (staffBody.items ?? []).filter((u) => u.status === 'ACTIVE');

  let created = 0;
  let skipped = 0;
  let placeholderCount = 0;
  for (const u of active) {
    const baseSalary = typeof u.baseSalary === 'number' && u.baseSalary > 0
      ? u.baseSalary
      : DEFAULT_BASE_SALARY;
    if (baseSalary === DEFAULT_BASE_SALARY) placeholderCount++;
    const res = await backendFetch('/finance/payroll', {
      method: 'POST',
      body: JSON.stringify({
        staffId: u.id,
        period,
        periodStart: start.toISOString().slice(0, 10),
        periodEnd: end.toISOString().slice(0, 10),
        baseSalary,
        allowances: 0,
        deductions: 0,
      }),
    });
    if (res.ok) created++;
    else skipped++;
  }

  revalidatePath('/finance/payroll');
  const placeholderNote =
    placeholderCount > 0
      ? ` ${placeholderCount} row${placeholderCount === 1 ? '' : 's'} use the placeholder salary - edit before approval.`
      : '';
  return {
    success: true,
    message: `Generated ${created} payroll row${created === 1 ? '' : 's'} for ${period}${
      skipped > 0 ? ` (${skipped} skipped - likely duplicates)` : ''
    }.${placeholderNote}`,
  };
}

/**
 * Edit a DRAFT payroll row's monetary fields. Optional `persistSalary=true`
 * also writes the new base salary to the staff member's User record, so future
 * `Generate Payroll` runs auto-populate this number.
 */
export async function updatePayrollEntry(
  payrollId: string,
  staffId: string,
  formData: FormData,
): Promise<ActionResult> {
  const baseSalary = Number(formData.get('baseSalary') ?? 0);
  const allowances = Number(formData.get('allowances') ?? 0);
  const deductions = Number(formData.get('deductions') ?? 0);
  const notes = (formData.get('notes') as string | null)?.trim() || undefined;
  const persist = formData.get('persistSalary') === 'on';

  const res = await backendFetch(`/finance/payroll/${payrollId}`, {
    method: 'PATCH',
    body: JSON.stringify({ baseSalary, allowances, deductions, notes }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };

  let persistMsg = '';
  if (persist && baseSalary > 0) {
    const sres = await backendFetch(`/staff/${staffId}/salary`, {
      method: 'PATCH',
      body: JSON.stringify({ baseSalary }),
    });
    persistMsg = sres.ok ? ' Default salary saved for future months.' : ' (Could not save default salary.)';
  }

  revalidatePath('/finance/payroll');
  return { success: true, message: `Payroll entry updated.${persistMsg}` };
}

/**
 * Set / update the persistent monthly base salary on a staff member without
 * touching a specific payroll row.
 */
export async function updateStaffSalary(
  staffId: string,
  baseSalary: number,
): Promise<ActionResult> {
  if (!Number.isFinite(baseSalary) || baseSalary < 0) {
    return { success: false, message: 'Invalid salary amount.' };
  }
  const res = await backendFetch(`/staff/${staffId}/salary`, {
    method: 'PATCH',
    body: JSON.stringify({ baseSalary }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/payroll');
  revalidatePath('/staff');
  return { success: true, message: 'Salary saved.' };
}

export async function updatePayrollStatus(
  payrollId: string,
  newStatus: PayrollStatus | string,
): Promise<ActionResult> {
  let path: string;
  let body: string | undefined;
  switch (newStatus) {
    case 'APPROVED':
      path = `/finance/payroll/${payrollId}/approve`;
      break;
    case 'PAID':
      path = `/finance/payroll/${payrollId}/mark-paid`;
      body = JSON.stringify({ paymentMethod: 'BANK_TRANSFER' });
      break;
    case 'CANCELLED':
      path = `/finance/payroll/${payrollId}/cancel`;
      body = JSON.stringify({ reason: 'Manually cancelled' });
      break;
    default:
      return {
        success: false,
        message: `Status ${newStatus} can't be set directly - only APPROVED / PAID / CANCELLED are transition targets.`,
      };
  }
  const res = await backendFetch(path, { method: 'POST', body });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/payroll');
  return { success: true, message: `Payroll ${newStatus.toLowerCase()}.` };
}

interface PayrollRow {
  id: string;
  status: PayrollStatus;
}

async function listForPeriod(period: string, status: PayrollStatus): Promise<PayrollRow[]> {
  const res = await backendFetch(
    `/finance/payroll?period=${encodeURIComponent(period)}&status=${status}&limit=500`,
  );
  if (!res.ok) return [];
  const body = (await res.json()) as { items: PayrollRow[] };
  return body.items ?? [];
}

export async function approveAllPayroll(period: string): Promise<ActionResult> {
  const drafts = await listForPeriod(period, 'DRAFT');
  let approved = 0;
  for (const row of drafts) {
    const res = await backendFetch(`/finance/payroll/${row.id}/approve`, { method: 'POST' });
    if (res.ok) approved++;
  }
  revalidatePath('/finance/payroll');
  return { success: true, message: `Approved ${approved} payroll row${approved === 1 ? '' : 's'} for ${period}.` };
}

export async function markAllPaidForPeriod(period: string): Promise<ActionResult> {
  const approved = await listForPeriod(period, 'APPROVED');
  let paid = 0;
  for (const row of approved) {
    const res = await backendFetch(`/finance/payroll/${row.id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'BANK_TRANSFER' }),
    });
    if (res.ok) paid++;
  }
  revalidatePath('/finance/payroll');
  return { success: true, message: `Paid ${paid} payroll row${paid === 1 ? '' : 's'} for ${period}.` };
}
