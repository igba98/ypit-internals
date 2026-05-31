'use server';

import { ActionResult } from '@/types';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

interface BackendErrorBody {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };
  statusCode?: number;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    avatar: string | null;
    mustChangePassword: boolean;
  };
}

export async function validateLogin(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string | null;
  const password = formData.get('password') as string | null;

  if (!email || !password) {
    return { success: false, message: 'Email and password are required' };
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return {
      success: false,
      message: 'Unable to reach the server. Please try again.',
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as BackendErrorBody | null;
    return {
      success: false,
      message: body?.error?.message ?? 'Login failed',
      errors: body?.error?.fieldErrors,
    };
  }

  const body = (await response.json()) as LoginResponse;

  const session = {
    userId: body.user.id,
    fullName: body.user.fullName,
    email: body.user.email,
    role: body.user.role,
    department: body.user.department,
    avatar: body.user.avatar ?? undefined,
  };

  const cookieStore = await cookies();

  // Session shape - read by middleware + SessionContext (existing contract).
  cookieStore.set('ypit_session', JSON.stringify(session), {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });

  // JWT - HttpOnly so it never reaches client JS. Server actions read it
  // and forward as `Authorization: Bearer <token>` to the backend.
  cookieStore.set('ypit_token', body.accessToken, {
    path: '/',
    maxAge: 86400,
    httpOnly: true,
    sameSite: 'lax',
  });

  // Returned shape matches what lib/auth.ts setSession() expects.
  return {
    success: true,
    message: 'Login successful',
    data: {
      id: body.user.id,
      fullName: body.user.fullName,
      email: body.user.email,
      role: body.user.role,
      department: body.user.department,
      avatar: body.user.avatar ?? undefined,
      mustChangePassword: body.user.mustChangePassword,
    },
  };
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('ypit_token')?.value;

  // Fire-and-forget - failure here mustn't prevent the local cookie cleanup.
  if (token) {
    fetch(`${BACKEND_API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch(() => {});
  }

  cookieStore.delete('ypit_session');
  cookieStore.delete('ypit_token');
}
