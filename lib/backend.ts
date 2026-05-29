import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

export interface BackendErrorBody {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };
  statusCode?: number;
  path?: string;
}

/**
 * Server-side fetch wrapper that:
 *   • prepends the backend base URL
 *   • forwards the user's JWT from the `ypit_token` cookie as Bearer auth
 *   • defaults to `cache: 'no-store'` (every server action is dynamic)
 *
 * Returns the raw Response so callers can branch on status and parse the body
 * themselves. Use from any `'use server'` action that hits the backend.
 */
export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = (await cookies()).get('ypit_token')?.value;

  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers,
    cache: init.cache ?? 'no-store',
  });
}
