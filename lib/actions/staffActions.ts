'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, User } from '@/types';
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

interface CreateStaffResult extends ActionResult {
  /** Surfaced ONCE to the admin so they can share it manually if the welcome email failed. */
  tempPassword?: string;
  emailDelivered?: boolean;
  emailError?: string;
}

export async function addStaff(
  _prev: unknown,
  formData: FormData,
): Promise<CreateStaffResult> {
  const body: Record<string, unknown> = {
    fullName: formStr(formData, 'fullName'),
    email: formStr(formData, 'email'),
    role: formStr(formData, 'role'),
    department: formStr(formData, 'department'),
    phone: formStr(formData, 'phone'),
  };

  const res = await backendFetch('/staff', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };

  const created = (await res.json()) as {
    user: User;
    tempPassword: string;
    email: { delivered: boolean; error?: string };
  };

  const baseSalary = Number(formData.get('baseSalary') ?? 0);
  if (Number.isFinite(baseSalary) && baseSalary > 0) {
    await backendFetch(`/staff/${created.user.id}/salary`, {
      method: 'PATCH',
      body: JSON.stringify({ baseSalary }),
    });
  }

  revalidatePath('/staff');
  revalidatePath('/finance/payroll');

  const deliveredNote = created.email.delivered
    ? 'Welcome email sent.'
    : `Email delivery failed - share the temp password manually${created.email.error ? ` (${created.email.error})` : ''}.`;

  return {
    success: true,
    message: `Staff added. ${deliveredNote}`,
    tempPassword: created.tempPassword,
    emailDelivered: created.email.delivered,
    emailError: created.email.error,
  };
}

export async function updateStaff(
  staffId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  for (const f of ['fullName', 'role', 'department', 'phone'] as const) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }
  const status = formStr(formData, 'status');
  if (status === 'ACTIVE' || status === 'INACTIVE' || status === 'SUSPENDED') {
    body.status = status;
  }

  const res = await backendFetch(`/staff/${staffId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };

  const baseSalaryRaw = formData.get('baseSalary');
  if (baseSalaryRaw !== null && baseSalaryRaw !== '') {
    const baseSalary = Number(baseSalaryRaw);
    if (Number.isFinite(baseSalary) && baseSalary >= 0) {
      await backendFetch(`/staff/${staffId}/salary`, {
        method: 'PATCH',
        body: JSON.stringify({ baseSalary }),
      });
    }
  }

  revalidatePath('/staff');
  revalidatePath(`/staff/${staffId}`);
  revalidatePath('/finance/payroll');
  return { success: true, message: 'Staff updated.' };
}

export async function deactivateStaff(staffId: string): Promise<ActionResult> {
  const res = await backendFetch(`/staff/${staffId}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/staff');
  return { success: true, message: 'Staff deactivated.' };
}

export interface ResetPasswordResult extends ActionResult {
  tempPassword?: string;
  emailDelivered?: boolean;
}

export async function resetStaffPassword(staffId: string): Promise<ResetPasswordResult> {
  const res = await backendFetch(`/staff/${staffId}/reset-password`, { method: 'POST' });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const body = (await res.json()) as {
    tempPassword: string;
    email: { delivered: boolean; error?: string };
  };
  return {
    success: true,
    message: body.email.delivered
      ? 'Temp password generated and emailed.'
      : 'Temp password generated. Email failed - share manually.',
    tempPassword: body.tempPassword,
    emailDelivered: body.email.delivered,
  };
}
