'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { backendFetch } from '@/lib/backend';

/**
 * The /leads page in this app tracks employee performance — marketing staff &
 * sub-agents whose conversion of students is measured.  So "Add Lead" here
 * means "add a marketing employee", which routes to the Staff endpoint (with
 * the temp-password + welcome-email flow that lives there).
 *
 * The actual Lead-PROSPECT entity (NEW → CONTACTED → COUNSELED → CONVERTED)
 * exists on the backend at `/leads` and gets its own Kanban UI in a follow-up.
 */
export async function addLead(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const fullName = (formData.get('fullName') as string | null)?.trim();
  const email = (formData.get('email') as string | null)?.trim();
  const phone = (formData.get('phone') as string | null)?.trim();
  const role = (formData.get('role') as string | null)?.trim();
  const department =
    (formData.get('department') as string | null)?.trim() || 'Marketing';

  if (!fullName || !email || !phone || !role) {
    return {
      success: false,
      message: 'Full name, email, phone, and role are required.',
    };
  }

  const res = await backendFetch('/staff', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, phone, role, department }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string; fieldErrors?: Record<string, string[]> };
    } | null;
    return {
      success: false,
      message: body?.error?.message ?? 'Failed to add lead.',
      errors: body?.error?.fieldErrors,
    };
  }

  const created = (await res.json()) as {
    tempPassword: string;
    email: { delivered: boolean };
  };

  revalidatePath('/leads');
  revalidatePath('/staff');
  return {
    success: true,
    message: `Lead added. Temporary password: ${created.tempPassword}${
      created.email.delivered ? ' (welcome email sent)' : ''
    }`,
  };
}
