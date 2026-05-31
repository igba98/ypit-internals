'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, CatalogStatus } from '@/types';
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

function formArr(formData: FormData, key: string): string[] {
  const raw = formStr(formData, key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFeeDefaults(formData: FormData): unknown[] {
  const raw = formStr(formData, 'feeDefaults');
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Universities ────────────────────────────────────────────────────────

export async function createUniversity(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    name: formStr(formData, 'name'),
    country: formStr(formData, 'country'),
    city: formStr(formData, 'city'),
    contactName: formStr(formData, 'contactName'),
    contactEmail: formStr(formData, 'contactEmail'),
    contactPhone: formStr(formData, 'contactPhone'),
  };
  const months = formArr(formData, 'defaultReportingMonths');
  if (months.length > 0) body.defaultReportingMonths = months;

  const res = await backendFetch('/finance/universities', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/catalog');
  return { success: true, message: 'University added.' };
}

export async function updateUniversity(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  for (const f of ['name', 'country', 'city', 'contactName', 'contactEmail', 'contactPhone']) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }
  const months = formArr(formData, 'defaultReportingMonths');
  if (months.length > 0) body.defaultReportingMonths = months;

  const res = await backendFetch(`/finance/universities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/catalog');
  return { success: true, message: 'University updated.' };
}

export async function setUniversityStatus(
  id: string,
  status: CatalogStatus,
): Promise<ActionResult> {
  if (status === 'ARCHIVED') {
    const res = await backendFetch(`/finance/universities/${id}`, { method: 'DELETE' });
    if (!res.ok) return { success: false, ...(await readError(res)) };
  } else {
    const res = await backendFetch(`/finance/universities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    if (!res.ok) return { success: false, ...(await readError(res)) };
  }
  revalidatePath('/finance/catalog');
  return { success: true, message: `University ${status.toLowerCase()}.` };
}

// ── Packages ────────────────────────────────────────────────────────────

export async function createPackage(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    universityId: formStr(formData, 'universityId'),
    name: formStr(formData, 'name'),
    studyLevel: formStr(formData, 'studyLevel'),
    program: formStr(formData, 'program'),
    description: formStr(formData, 'description'),
    feeDefaults: parseFeeDefaults(formData),
  };

  const res = await backendFetch('/finance/packages', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/catalog');
  return { success: true, message: 'Package added.' };
}

export async function updatePackage(
  id: string,
  formData: FormData,
  _applyTo?: string,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  for (const f of ['name', 'studyLevel', 'program', 'description']) {
    const v = formStr(formData, f);
    if (v !== undefined) body[f] = v;
  }
  const fees = parseFeeDefaults(formData);
  if (fees.length > 0) body.feeDefaults = fees;

  const res = await backendFetch(`/finance/packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/catalog');
  return { success: true, message: 'Package updated.' };
}

export async function setPackageStatus(
  id: string,
  status: CatalogStatus,
): Promise<ActionResult> {
  if (status === 'ARCHIVED') {
    const res = await backendFetch(`/finance/packages/${id}`, { method: 'DELETE' });
    if (!res.ok) return { success: false, ...(await readError(res)) };
  } else {
    const res = await backendFetch(`/finance/packages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    if (!res.ok) return { success: false, ...(await readError(res)) };
  }
  revalidatePath('/finance/catalog');
  return { success: true, message: `Package ${status.toLowerCase()}.` };
}

/** Duplicate via fetch-then-create — backend has no single-shot duplicate. */
export async function duplicatePackage(id: string): Promise<ActionResult> {
  const getRes = await backendFetch(`/finance/packages/${id}`);
  if (!getRes.ok) return { success: false, ...(await readError(getRes)) };
  const src = (await getRes.json()) as {
    universityId: string;
    name: string;
    studyLevel: string;
    program: string;
    description?: string | null;
    feeDefaults: unknown;
  };

  const res = await backendFetch('/finance/packages', {
    method: 'POST',
    body: JSON.stringify({
      universityId: src.universityId,
      name: `${src.name} (Copy)`,
      studyLevel: src.studyLevel,
      program: src.program,
      description: src.description ?? undefined,
      feeDefaults: Array.isArray(src.feeDefaults) ? src.feeDefaults : [],
    }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/catalog');
  return { success: true, message: 'Package duplicated.' };
}

// ── Ledger assignment ──────────────────────────────────────────────────

export async function assignPackageToStudent(
  studentId: string,
  packageId: string,
): Promise<ActionResult> {
  const res = await backendFetch(
    `/finance/students/${studentId}/ledger/assign`,
    {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    },
  );
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/finance/catalog');
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Package assigned to student.' };
}

export async function reassignPackageToStudent(
  studentId: string,
  newPackageId: string,
): Promise<ActionResult> {
  return assignPackageToStudent(studentId, newPackageId);
}
