'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ActionResult, Session } from '@/types';
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

export async function updateProfile(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  const fullName = formStr(formData, 'fullName');
  if (fullName) body.fullName = fullName;
  const phone = formStr(formData, 'phone');
  if (phone !== undefined) body.phone = phone;

  const res = await backendFetch('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };

  const user = (await res.json()) as {
    id: string;
    email: string;
    fullName: string;
    role: Session['role'];
    department: string;
    avatar: string | null;
  };

  // Re-issue the session cookie so the sidebar/topbar show the new name
  // immediately (same shape + options as the login action).
  const cookieStore = await cookies();
  const session: Session = {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    department: user.department,
    avatar: user.avatar ?? undefined,
  };
  cookieStore.set('ypit_session', JSON.stringify(session), {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });

  revalidatePath('/settings');
  return { success: true, message: 'Profile updated.' };
}

export async function changePassword(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const currentPassword = formStr(formData, 'currentPassword');
  const newPassword = formStr(formData, 'newPassword');
  const confirmPassword = formStr(formData, 'confirmPassword');

  if (!currentPassword || !newPassword) {
    return { success: false, message: 'Current and new password are required.' };
  }
  if (newPassword.length < 8) {
    return { success: false, message: 'New password must be at least 8 characters.' };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, message: 'New passwords do not match.' };
  }

  const res = await backendFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  return { success: true, message: 'Password changed.' };
}
