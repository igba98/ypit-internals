'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ActionResult, Guardian } from '@/types';
import { mockGuardians } from '@/lib/mock/mockGuardians';
import { guardianSchema } from '@/lib/validations/guardian';

function coerceIsPrimary(v: unknown): boolean {
  return v === true || v === 'on' || v === 'true';
}

export async function addGuardian(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  const parsed = guardianSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors.', errors: z.flattenError(parsed.error).fieldErrors };
  }
  const isPrimary = coerceIsPrimary(parsed.data.isPrimary);

  if (isPrimary) {
    for (const g of mockGuardians) {
      if (g.studentId === parsed.data.studentId) g.isPrimary = false;
    }
  }

  const forcedPrimary = isPrimary || !mockGuardians.some(g => g.studentId === parsed.data.studentId);

  const guardian: Guardian = {
    id: `gdn_${Math.random().toString(36).slice(2, 11)}`,
    studentId: parsed.data.studentId,
    fullName: parsed.data.fullName,
    relation: parsed.data.relation,
    phone: parsed.data.phone,
    whatsapp: parsed.data.whatsapp || undefined,
    email: parsed.data.email || undefined,
    isPrimary: forcedPrimary,
    createdAt: new Date().toISOString(),
  };
  mockGuardians.unshift(guardian);

  revalidatePath(`/students/${parsed.data.studentId}`);
  return { success: true, message: 'Guardian added.' };
}

export async function deleteGuardian(guardianId: string): Promise<ActionResult> {
  const idx = mockGuardians.findIndex(g => g.id === guardianId);
  if (idx === -1) return { success: false, message: 'Guardian not found.' };
  const [removed] = mockGuardians.splice(idx, 1);

  if (removed.isPrimary) {
    const next = mockGuardians.find(g => g.studentId === removed.studentId);
    if (next) next.isPrimary = true;
  }

  revalidatePath(`/students/${removed.studentId}`);
  return { success: true, message: 'Guardian removed.' };
}

export async function setPrimaryGuardian(guardianId: string): Promise<ActionResult> {
  const target = mockGuardians.find(g => g.id === guardianId);
  if (!target) return { success: false, message: 'Guardian not found.' };
  for (const g of mockGuardians) {
    if (g.studentId === target.studentId) g.isPrimary = g.id === guardianId;
  }
  revalidatePath(`/students/${target.studentId}`);
  return { success: true, message: `${target.fullName} is now the primary contact.` };
}