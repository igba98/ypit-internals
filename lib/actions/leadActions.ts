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
 * Capture a STUDENT prospect as a Lead - the rich "student form" a sub-agent or
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
    countryOfOrigin: get('countryOfOrigin'),
    previousSchool: get('previousSchool'),
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

// ── System updates 2.0: working and distributing leads ─────────────

async function leadError(res: Response): Promise<string> {
  const b = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return b?.error?.message ?? `Request failed (${res.status}).`;
}

/** Status / assignee change. ROs change status on their own leads; only IT, MM, MD reassign. */
export async function updateLead(
  id: string,
  patch: { status?: string; assignedToId?: string | null; notes?: string | null; followUpDate?: string | null },
): Promise<ActionResult> {
  const res = await backendFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  if (!res.ok) return { success: false, message: await leadError(res) };
  revalidatePath('/student-leads');
  revalidatePath('/leads');
  return { success: true, message: patch.assignedToId !== undefined ? 'Lead reassigned.' : 'Lead updated.' };
}

/** IT → Relations Officers. Several officers = balanced round-robin. */
export async function distributeLeads(
  leadIds: string[],
  officerIds: string[],
): Promise<ActionResult & { assigned?: number }> {
  const res = await backendFetch('/leads/distribute', {
    method: 'POST',
    body: JSON.stringify({ leadIds, officerIds }),
  });
  if (!res.ok) return { success: false, message: await leadError(res) };
  const body = (await res.json()) as {
    assigned: number;
    summary: { officerName: string; assigned: number }[];
  };
  revalidatePath('/student-leads');
  revalidatePath('/leads');
  return {
    success: true,
    assigned: body.assigned,
    message: `Assigned ${body.assigned} lead(s): ${body.summary.map((s) => `${s.officerName} ${s.assigned}`).join(', ')}.`,
  };
}

export async function convertLeadToStudent(
  id: string,
  input: Record<string, string | undefined>,
): Promise<ActionResult & { studentId?: string }> {
  const body: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) if (v && v.trim()) body[k] = v.trim();
  const res = await backendFetch(`/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) return { success: false, message: await leadError(res) };
  const out = (await res.json()) as { student: { id: string; registrationNumber: string } };
  revalidatePath('/student-leads');
  revalidatePath('/students');
  revalidatePath('/leads');
  return {
    success: true,
    studentId: out.student.id,
    message: `Converted - student ${out.student.registrationNumber} created.`,
  };
}
