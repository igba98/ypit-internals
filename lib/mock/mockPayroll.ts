import { PayrollEntry, Role } from '@/types';

/**
 * Default monthly base salary per role in TZS.
 * Used by the "Generate Payroll" action to seed a new month.
 */
export const ROLE_BASE_SALARY: Record<Role, number> = {
  MANAGING_DIRECTOR: 5000000,
  MARKETING_MANAGER: 3500000,
  IT_ADMIN: 2800000,
  FINANCE: 2800000,
  ADMISSIONS: 2200000,
  TRAVEL: 2200000,
  OPERATIONS: 2200000,
  MARKETING_STAFF: 1500000,
  SUB_AGENT: 0, // commission-based, no base salary
};

const computeNet = (base: number, allowances = 0, deductions = 0) => {
  const gross = base + allowances;
  // PAYE rough: 9% above 270k threshold for simplicity (Tanzania-style)
  const tax = Math.max(0, Math.round((gross - 270000) * 0.09));
  // NSSF rough: 10% of base, employee share
  const pension = Math.round(base * 0.1);
  const net = gross - tax - pension - deductions;
  return { tax, pension, net };
};

const make = (
  id: string,
  staffId: string,
  staffName: string,
  staffRole: Role,
  department: string,
  period: string,
  periodStart: string,
  periodEnd: string,
  base: number,
  status: PayrollEntry['status'] = 'PAID',
  paidDate?: string,
): PayrollEntry => {
  const allowances = staffRole === 'MANAGING_DIRECTOR' ? 500000 : staffRole === 'MARKETING_MANAGER' ? 300000 : 150000;
  const deductions = 0;
  const { tax, pension, net } = computeNet(base, allowances, deductions);
  return {
    id,
    staffId,
    staffName,
    staffRole,
    department,
    period,
    periodStart,
    periodEnd,
    baseSalary: base,
    allowances,
    deductions,
    tax,
    pension,
    netPay: net,
    status,
    paidDate,
    paymentMethod: status === 'PAID' ? 'BANK_TRANSFER' : undefined,
    createdAt: periodStart,
  };
};

export const mockPayroll: PayrollEntry[] = [
  // February 2026 — fully processed
  make('PR-2026-FEB-001', 'usr_001', 'David Mwangi', 'MANAGING_DIRECTOR', 'Executive', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 5000000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-002', 'usr_002', 'Sarah Kimani', 'MARKETING_MANAGER', 'Marketing', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 3500000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-003', 'usr_003', 'James Osei', 'IT_ADMIN', 'IT', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 2800000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-004', 'usr_004', 'Amina Saleh', 'FINANCE', 'Finance', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 2800000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-005', 'usr_005', 'Peter Njoroge', 'ADMISSIONS', 'Admissions', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 2200000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-006', 'usr_006', 'Grace Auma', 'TRAVEL', 'Travel', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 2200000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-007', 'usr_007', 'Ibrahim Hassan', 'OPERATIONS', 'Operations', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 2200000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-008', 'usr_008', 'Linda Owusu', 'MARKETING_STAFF', 'Marketing', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 1500000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-009', 'usr_010', 'Michael Osei', 'MARKETING_STAFF', 'Marketing', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 1500000, 'PAID', '2026-02-28T00:00:00Z'),
  make('PR-2026-FEB-010', 'usr_012', 'James Kamau', 'MARKETING_STAFF', 'Marketing', 'February 2026', '2026-02-01T00:00:00Z', '2026-02-28T00:00:00Z', 1500000, 'PAID', '2026-02-28T00:00:00Z'),

  // March 2026 — approved, partially paid
  make('PR-2026-MAR-001', 'usr_001', 'David Mwangi', 'MANAGING_DIRECTOR', 'Executive', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 5000000, 'PAID', '2026-03-28T00:00:00Z'),
  make('PR-2026-MAR-002', 'usr_002', 'Sarah Kimani', 'MARKETING_MANAGER', 'Marketing', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 3500000, 'PAID', '2026-03-28T00:00:00Z'),
  make('PR-2026-MAR-003', 'usr_003', 'James Osei', 'IT_ADMIN', 'IT', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 2800000, 'APPROVED'),
  make('PR-2026-MAR-004', 'usr_004', 'Amina Saleh', 'FINANCE', 'Finance', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 2800000, 'APPROVED'),
  make('PR-2026-MAR-005', 'usr_005', 'Peter Njoroge', 'ADMISSIONS', 'Admissions', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 2200000, 'APPROVED'),
  make('PR-2026-MAR-006', 'usr_006', 'Grace Auma', 'TRAVEL', 'Travel', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 2200000, 'APPROVED'),
  make('PR-2026-MAR-007', 'usr_007', 'Ibrahim Hassan', 'OPERATIONS', 'Operations', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 2200000, 'APPROVED'),
  make('PR-2026-MAR-008', 'usr_008', 'Linda Owusu', 'MARKETING_STAFF', 'Marketing', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 1500000, 'DRAFT'),
  make('PR-2026-MAR-009', 'usr_010', 'Michael Osei', 'MARKETING_STAFF', 'Marketing', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 1500000, 'DRAFT'),
  make('PR-2026-MAR-010', 'usr_012', 'James Kamau', 'MARKETING_STAFF', 'Marketing', 'March 2026', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 1500000, 'DRAFT'),
];
