'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { backendFetch } from '@/lib/backend';

/**
 * The /leads page in this app tracks employee performance - marketing staff &
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

/**
 * Capture a STUDENT prospect as a Lead — the rich "student form" a sub-agent or
 * marketing staff fills in. Posts to the backend Lead entity (NEW status); the
 * extra student-profile fields are stored so conversion later is one-click.
 * Sub-agents are auto-credited as the assigned owner by the backend (createdBy).
 */
export async function createStudentLead(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const get = (k: string) => (formData.get(k) as string | null)?.trim() || undefined;

  const fullName = get('fullName');
  const phone = get('phone');
  const source = get('source');
  const interestedIn = get('interestedIn'); // target program
  const interestedCountry = get('interestedCountry'); // target country

  if (!fullName || !phone || !source || !interestedIn) {
    return {
      success: false,
      message:
        'Full name, phone, source and the program of interest are required.',
    };
  }

  const payload = {
    fullName,
    phone,
    email: get('email'),
    source,
    interestedIn,
    interestedCountry,
    whatsapp: get('whatsapp'),
    nationality: get('nationality'),
    passportNumber: get('passportNumber'),
    gender: get('gender'),
    dateOfBirth: get('dateOfBirth'),
    targetUniversity: get('targetUniversity'),
    targetIntake: get('targetIntake'),
    notes: get('notes'),
    assignedToId: get('assignedToId'),
  };

  const res = await backendFetch('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string; fieldErrors?: Record<string, string[]> };
    } | null;
    return {
      success: false,
      message: body?.error?.message ?? 'Failed to add the student lead.',
      errors: body?.error?.fieldErrors,
    };
  }

  revalidatePath('/student-leads');
  return { success: true, message: `${fullName} added as a student lead.` };
}
