'use server';

import { revalidatePath } from 'next/cache';
import { mockUniversities } from '../mock/mockUniversities';
import { mockPackages, getPackageById, getActivePackagesForUniversity } from '../mock/mockPackages';
import { mockFeeLedgers, getFeeLedgerForStudent } from '../mock/mockFeeLedgers';
import { mockStudents } from '../mock/mockStudents';
import { mockAuditLogs } from '../mock/mockAuditLogs';
import {
  ActionResult,
  University,
  Package,
  FeeDefault,
  FeeLine,
  FeeDueRule,
  StudentFeeLedger,
  CatalogStatus,
} from '@/types';
import { universitySchema, packageSchema } from '../validations/catalog';

// ----- helpers -----

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function uniqueId(prefix: string, name: string): string {
  return `${prefix}_${slugify(name)}_${Date.now().toString(36).slice(-4)}`;
}

function logAudit(
  module: 'FINANCE_CATALOG' | 'FEE_LEDGER',
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  detail: string,
  entityId?: string,
  entityType?: string,
  previousValue?: string,
  newValue?: string,
): void {
  mockAuditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: 'usr_system',
    userName: 'System',
    userRole: 'FINANCE',
    action,
    module,
    detail,
    entityId,
    entityType,
    previousValue,
    newValue,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Compute a concrete due-date for a FeeDefault, given the student's enrollment
 * date and (optionally) their target intake date.
 */
function resolveDueDate(rule: FeeDueRule, enrollmentDate: Date, reportingDate?: Date): string {
  const date = new Date(enrollmentDate);
  switch (rule.kind) {
    case 'ON_ENROLLMENT':
      return date.toISOString();
    case 'DAYS_FROM_ENROLLMENT': {
      date.setDate(date.getDate() + rule.days);
      return date.toISOString();
    }
    case 'BEFORE_REPORTING_DATE': {
      const base = reportingDate ?? new Date(date.getFullYear(), date.getMonth() + 3, 1);
      const out = new Date(base);
      out.setDate(out.getDate() - rule.days);
      return out.toISOString();
    }
    case 'CUSTOM':
      date.setDate(date.getDate() + 90);
      return date.toISOString();
  }
}

function materializeFeeLines(pkg: Package, enrollmentDate: Date, reportingDate?: Date): FeeLine[] {
  return pkg.feeDefaults.map((d, idx) => ({
    id: `fl_${Date.now()}_${idx}`,
    type: d.type,
    label: d.label ?? defaultLabelFor(d.type),
    amount: d.amount,
    currency: d.currency,
    dueDate: resolveDueDate(d.dueRule, enrollmentDate, reportingDate),
    paidAmount: 0,
    status: 'UNPAID',
    sourceFeeDefaultIndex: idx,
  }));
}

function defaultLabelFor(type: FeeDefault['type']): string {
  return {
    APPLICATION: 'Application Fee',
    TUITION: 'Tuition',
    HOSTEL: 'Accommodation',
    AGENCY: 'Agency Fee',
    DEPOSIT: 'Deposit',
    INSURANCE: 'Insurance',
    VISA: 'Visa',
    AIRPORT_PICKUP: 'Airport Pickup',
    OTHER: 'Other',
  }[type];
}

// ===== UNIVERSITY ACTIONS =====

export async function createUniversity(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = universitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors };
  }
  const { name } = parsed.data;
  if (mockUniversities.some(u => u.name.toLowerCase() === name.toLowerCase() && u.status === 'ACTIVE')) {
    return { success: false, message: 'A university with that name already exists.' };
  }
  const created: University = {
    id: uniqueId('uni', name),
    ...parsed.data,
    contactEmail: parsed.data.contactEmail || undefined,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  mockUniversities.push(created);
  logAudit('FINANCE_CATALOG', 'CREATE', `University "${name}" created`, created.id, 'University', undefined, JSON.stringify(created));
  revalidatePath('/finance/catalog');
  return { success: true, message: 'University created.', data: created };
}

export async function updateUniversity(id: string, formData: FormData): Promise<ActionResult> {
  const parsed = universitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors };
  }
  const idx = mockUniversities.findIndex(u => u.id === id);
  if (idx === -1) return { success: false, message: 'University not found.' };

  const before = JSON.stringify(mockUniversities[idx]);
  mockUniversities[idx] = {
    ...mockUniversities[idx],
    ...parsed.data,
    contactEmail: parsed.data.contactEmail || undefined,
  };
  logAudit('FINANCE_CATALOG', 'UPDATE', `University "${parsed.data.name}" updated`, id, 'University', before, JSON.stringify(mockUniversities[idx]));
  revalidatePath('/finance/catalog');
  return { success: true, message: 'University updated.' };
}

export async function setUniversityStatus(id: string, status: CatalogStatus): Promise<ActionResult> {
  const idx = mockUniversities.findIndex(u => u.id === id);
  if (idx === -1) return { success: false, message: 'University not found.' };

  if (status === 'ARCHIVED') {
    const activePackages = getActivePackagesForUniversity(id);
    if (activePackages.length > 0) {
      return {
        success: false,
        message: `Cannot archive — ${activePackages.length} active package(s) exist. Archive packages first.`,
      };
    }
  }
  mockUniversities[idx].status = status;
  logAudit('FINANCE_CATALOG', 'UPDATE', `University ${status === 'ARCHIVED' ? 'archived' : 'restored'}`, id, 'University');
  revalidatePath('/finance/catalog');
  return { success: true, message: status === 'ARCHIVED' ? 'University archived.' : 'University restored.' };
}

// ===== PACKAGE ACTIONS =====

function parsePackageFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const feeDefaultsRaw = raw.feeDefaults ?? '[]';
  let feeDefaults: unknown;
  try { feeDefaults = JSON.parse(feeDefaultsRaw); } catch { feeDefaults = []; }
  return { ...raw, feeDefaults };
}

export async function createPackage(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = packageSchema.safeParse(parsePackageFormData(formData));
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors };
  }
  const { universityId, name } = parsed.data;
  const uni = mockUniversities.find(u => u.id === universityId);
  if (!uni || uni.status !== 'ACTIVE') {
    return { success: false, message: 'Selected university is not active.' };
  }
  if (mockPackages.some(p => p.universityId === universityId && p.name.toLowerCase() === name.toLowerCase() && p.status === 'ACTIVE')) {
    return { success: false, message: 'A package with that name already exists for this university.' };
  }
  const now = new Date().toISOString();
  const created: Package = {
    id: uniqueId('pkg', `${universityId}_${name}`),
    ...parsed.data,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  mockPackages.push(created);
  logAudit('FINANCE_CATALOG', 'CREATE', `Package "${name}" created`, created.id, 'Package', undefined, JSON.stringify(created));
  revalidatePath('/finance/catalog');
  return { success: true, message: 'Package created.', data: created };
}

export async function updatePackage(
  id: string,
  formData: FormData,
  applyTo: 'NEW_ONLY' | 'NEW_AND_UNPAID',
): Promise<ActionResult> {
  const parsed = packageSchema.safeParse(parsePackageFormData(formData));
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors };
  }
  const idx = mockPackages.findIndex(p => p.id === id);
  if (idx === -1) return { success: false, message: 'Package not found.' };

  const before = mockPackages[idx];
  const beforeJson = JSON.stringify(before);
  const updated: Package = {
    ...before,
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };
  mockPackages[idx] = updated;

  if (applyTo === 'NEW_AND_UNPAID') {
    for (const ledger of mockFeeLedgers) {
      if (ledger.packageId !== id) continue;
      ledger.lines = ledger.lines.map(line => {
        if (line.status === 'PAID' || line.status === 'WAIVED') return line;
        if (line.sourceFeeDefaultIndex === undefined) return line;
        const newDefault = updated.feeDefaults[line.sourceFeeDefaultIndex];
        if (!newDefault) return line;
        return { ...line, amount: newDefault.amount, currency: newDefault.currency };
      });
      ledger.updatedAt = new Date().toISOString();
    }
  }
  logAudit('FINANCE_CATALOG', 'UPDATE', `Package "${updated.name}" updated · applyTo=${applyTo}`, id, 'Package', beforeJson, JSON.stringify(updated));
  revalidatePath('/finance/catalog');
  revalidatePath('/students');
  revalidatePath('/payments');
  return { success: true, message: 'Package updated.' };
}

export async function setPackageStatus(id: string, status: CatalogStatus): Promise<ActionResult> {
  const idx = mockPackages.findIndex(p => p.id === id);
  if (idx === -1) return { success: false, message: 'Package not found.' };
  mockPackages[idx].status = status;
  mockPackages[idx].updatedAt = new Date().toISOString();
  logAudit('FINANCE_CATALOG', 'UPDATE', `Package ${status === 'ARCHIVED' ? 'archived' : 'restored'}`, id, 'Package');
  revalidatePath('/finance/catalog');
  return { success: true, message: status === 'ARCHIVED' ? 'Package archived.' : 'Package restored.' };
}

export async function duplicatePackage(id: string): Promise<ActionResult> {
  const src = getPackageById(id);
  if (!src) return { success: false, message: 'Package not found.' };
  const now = new Date().toISOString();
  const copy: Package = {
    ...src,
    id: uniqueId('pkg', `${src.universityId}_${src.name}_copy`),
    name: `${src.name} (Copy)`,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  mockPackages.push(copy);
  logAudit('FINANCE_CATALOG', 'CREATE', `Package "${copy.name}" duplicated from ${src.id}`, copy.id, 'Package');
  revalidatePath('/finance/catalog');
  return { success: true, message: 'Package duplicated.', data: copy };
}

// ===== ASSIGN / REASSIGN =====

export async function assignPackageToStudent(studentId: string, packageId: string): Promise<ActionResult> {
  const student = mockStudents.find(s => s.id === studentId);
  if (!student) return { success: false, message: 'Student not found.' };
  const pkg = getPackageById(packageId);
  if (!pkg) return { success: false, message: 'Package not found.' };
  if (pkg.status !== 'ACTIVE') return { success: false, message: 'Package is archived.' };
  if (getFeeLedgerForStudent(studentId)) {
    return { success: false, message: 'Student already has a fee ledger. Use reassign instead.' };
  }

  const enrollmentDate = new Date();
  const ledger: StudentFeeLedger = {
    studentId,
    packageId,
    currencyDisplay: 'TZS',
    lines: materializeFeeLines(pkg, enrollmentDate),
    createdAt: enrollmentDate.toISOString(),
    updatedAt: enrollmentDate.toISOString(),
  };
  mockFeeLedgers.push(ledger);
  logAudit('FEE_LEDGER', 'CREATE', `Ledger created for ${student.fullName} via "${pkg.name}"`, studentId, 'StudentFeeLedger');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/payments');
  revalidatePath('/finance');
  return { success: true, message: 'Package assigned and fee ledger created.', data: ledger };
}

export async function reassignPackageToStudent(studentId: string, newPackageId: string): Promise<ActionResult> {
  const ledger = getFeeLedgerForStudent(studentId);
  if (!ledger) return assignPackageToStudent(studentId, newPackageId);

  const pkg = getPackageById(newPackageId);
  if (!pkg) return { success: false, message: 'Package not found.' };
  if (pkg.status !== 'ACTIVE') return { success: false, message: 'Package is archived.' };

  const paid = ledger.lines.filter(l => l.status === 'PAID' || l.paidAmount > 0);
  ledger.packageId = newPackageId;
  ledger.lines = [...paid, ...materializeFeeLines(pkg, new Date())];
  ledger.updatedAt = new Date().toISOString();
  logAudit('FEE_LEDGER', 'UPDATE', `Reassigned to package "${pkg.name}" (kept ${paid.length} paid/partial lines)`, studentId, 'StudentFeeLedger');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/payments');
  return { success: true, message: 'Package reassigned. Paid/partial lines preserved.' };
}
