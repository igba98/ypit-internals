# Finance Phase 1 - Fee Structures & Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [docs/superpowers/specs/2026-05-26-finance-phase-1-fee-structures-and-packages-design.md](../specs/2026-05-26-finance-phase-1-fee-structures-and-packages-design.md)

**Goal:** Replace the rigid single-currency `PaymentRecord` with a multi-currency per-student fee ledger driven by a finance-authored catalog of Universities and Packages.

**Architecture:** Two-level catalog (`University` → `Package` → `FeeDefault[]`). When Marketing assigns a package to a new student, the system materializes a `StudentFeeLedger` with one `FeeLine` per fee default. Finance can override individual lines (scholarships) with audit trail. KPIs roll up native-currency amounts via a static FX rates config.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · zod · react-hook-form · sonner toasts · lucide-react icons · existing mock-data layer (in-memory arrays in `lib/mock/`)

**TDD note:** This codebase has no unit-test runner. The TDD signal here is `npm run typecheck` - write the consumer first (so typecheck fails with a specific "X does not exist" error), then implement the producer to make typecheck pass. Commands shown use `npm`; use `yarn` if `yarn.lock` is the only lockfile present.

---

## File structure

**New files (in order they're created):**

```
types/index.ts                                          MODIFY: add new types alongside old
lib/finance/fxRates.ts                                  NEW: currency conversion utility
lib/mock/mockUniversities.ts                            NEW: 3 universities
lib/mock/mockPackages.ts                                NEW: 6 packages
lib/mock/mockFeeLedgers.ts                              NEW: 7 migrated + 3 fresh ledgers
lib/validations/catalog.ts                              NEW: zod schemas for catalog
lib/actions/catalogActions.ts                           NEW: server actions for catalog CRUD
lib/actions/feeLineActions.ts                           NEW: server actions for fee line ops

app/(dashboard)/finance/catalog/page.tsx                NEW: catalog hub (split view)
app/(dashboard)/finance/catalog/[packageId]/page.tsx    NEW: package detail
app/(dashboard)/finance/catalog/_components/
  CatalogSplitView.tsx                                  NEW: client component, orchestrates the two panes
  UniversityList.tsx                                    NEW: left pane
  UniversityForm.tsx                                    NEW: new/edit university sheet
  PackageList.tsx                                       NEW: right pane, grouped by study level
  PackageForm.tsx                                       NEW: new/edit package sheet
  FeeDefaultsEditor.tsx                                 NEW: repeating-rows editor
  PackageEditConfirmDialog.tsx                          NEW: three-way modal for Flow E
  CatalogActions.tsx                                    NEW: misc archive/restore buttons
```

**Modified files (consumers of the legacy `PaymentRecord` shape):**

```
app/(dashboard)/finance/_components/FinanceSubNav.tsx           ADD Catalog tab
app/(dashboard)/students/_components/AddStudentForm.tsx         ADD Package picker
app/(dashboard)/students/[id]/_components/PaymentsTab.tsx       REWRITE to render FeeLines
app/(dashboard)/payments/page.tsx                               REWRITE KPIs + table
app/(dashboard)/payments/_components/PaymentsTable.tsx          REWRITE to render FeeLines
app/(dashboard)/payments/_components/RecordPaymentForm.tsx      TYPE-ONLY UPDATE (full rewrite is Phase 2)
app/(dashboard)/payments/[id]/page.tsx                          REWRITE to show fee ledger
app/(dashboard)/finance/page.tsx                                UPDATE receivables math
lib/studentDetail.ts                                            UPDATE to read fee ledger
lib/actions/genericActions.ts                                   REMOVE payments collection
lib/validations/payment.ts                                      UPDATE feeType enum
lib/statusOptions.ts                                            ADD FEE_LINE_STATUS_OPTIONS; remove PAYMENT_STATUS_OPTIONS
```

**Files deleted at end:**

```
lib/mock/mockPayments.ts
lib/actions/paymentActions.ts        (renamed to feeLineActions.ts in Task 6, content rewritten)
```

---

## Task 1: Add new types alongside legacy types

**Goal:** Define every new type the rest of the plan depends on, without breaking anything yet.

**Files:**
- Modify: `types/index.ts` (append below the existing FINANCE MODULE section)

- [ ] **Step 1: Snapshot baseline - typecheck must currently pass**

Run: `npm run typecheck`
Expected: exits 0 with no errors.

If it fails, STOP. Fix the baseline before proceeding.

- [ ] **Step 2: Append the new types to `types/index.ts`**

Add this block at the end of [types/index.ts](types/index.ts):

```ts
// ============================================================
// FINANCE PHASE 1 - Catalog & per-student fee ledger
// ============================================================

export type Currency = 'TZS' | 'USD' | 'GBP' | 'EUR';

export type FeeType =
  | 'APPLICATION'
  | 'TUITION'
  | 'HOSTEL'
  | 'AGENCY'
  | 'DEPOSIT'
  | 'INSURANCE'
  | 'VISA'
  | 'AIRPORT_PICKUP'
  | 'OTHER';

export type StudyLevel = 'FOUNDATION' | 'BACHELOR' | 'MASTERS' | 'PHD' | 'DIPLOMA';

export type CatalogStatus = 'ACTIVE' | 'ARCHIVED';

export interface University {
  id: string;                       // uni_coventry_london
  name: string;                     // "Coventry University London"
  country: string;                  // "United Kingdom"
  city?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  defaultReportingMonths?: string[]; // ['September', 'January']
  status: CatalogStatus;
  createdAt: string;
}

export type FeeDueRule =
  | { kind: 'DAYS_FROM_ENROLLMENT'; days: number }
  | { kind: 'BEFORE_REPORTING_DATE'; days: number }
  | { kind: 'ON_ENROLLMENT' }
  | { kind: 'CUSTOM' };

export interface FeeDefault {
  type: FeeType;
  label?: string;
  amount: number;
  currency: Currency;
  dueRule: FeeDueRule;
  required: boolean;
}

export interface Package {
  id: string;                       // pkg_coventry_london_bachelor_business
  universityId: string;
  name: string;
  studyLevel: StudyLevel;
  program: string;
  description?: string;
  feeDefaults: FeeDefault[];
  status: CatalogStatus;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type FeeLineStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED';

export interface FeeLine {
  id: string;                       // fl_001
  type: FeeType;
  label: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  paidAmount: number;
  status: FeeLineStatus;
  overrideReason?: string;
  overriddenById?: string;
  overriddenByName?: string;
  overriddenAt?: string;
  sourceFeeDefaultIndex?: number;
}

export interface StudentFeeLedger {
  studentId: string;
  packageId?: string;
  currencyDisplay?: Currency;       // KPI rollup pref; default TZS
  lines: FeeLine[];
  createdAt: string;
  updatedAt: string;
}
```

DO NOT remove `PaymentRecord`, `PaymentStatus`, or any other existing type in this task.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. Pure additions - no consumer is affected yet.

- [ ] **Step 4: Commit**

```bash
git add types/index.ts
git commit -m "feat(finance): add Phase 1 catalog & fee ledger types"
```

---

## Task 2: FX rates utility

**Goal:** Pure, self-contained currency converter so KPI rollups can mix TZS/USD/GBP.

**Files:**
- Create: `lib/finance/fxRates.ts`

- [ ] **Step 1: Create the file**

Write the full content of [lib/finance/fxRates.ts](../../lib/finance/fxRates.ts):

```ts
import { Currency } from '@/types';

/**
 * Static FX rates against TZS. Phase 1 ships with these; a future phase
 * will let Finance edit them via UI. Keep in sync with the spec.
 */
export const FX_RATES_TO_TZS: Record<Currency, number> = {
  TZS: 1,
  USD: 2600,
  GBP: 3250,
  EUR: 2800,
};

export function convertToTzs(amount: number, from: Currency): number {
  return Math.round(amount * FX_RATES_TO_TZS[from]);
}

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return Math.round((amount * FX_RATES_TO_TZS[from]) / FX_RATES_TO_TZS[to]);
}

/** Sum a list of (amount, currency) pairs into a single target currency. */
export function sumInCurrency(
  items: ReadonlyArray<{ amount: number; currency: Currency }>,
  target: Currency,
): number {
  return items.reduce((acc, it) => acc + convertCurrency(it.amount, it.currency, target), 0);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add lib/finance/fxRates.ts
git commit -m "feat(finance): add FX rates utility for multi-currency rollup"
```

---

## Task 3: Mock universities

**Goal:** Three universities to exercise active + archived states.

**Files:**
- Create: `lib/mock/mockUniversities.ts`

- [ ] **Step 1: Create the file**

Write [lib/mock/mockUniversities.ts](../../lib/mock/mockUniversities.ts):

```ts
import { University } from '@/types';

export const mockUniversities: University[] = [
  {
    id: 'uni_coventry_london',
    name: 'Coventry University London',
    country: 'United Kingdom',
    city: 'London',
    contactName: 'Admissions Office',
    contactEmail: 'admissions@coventry.ac.uk',
    contactPhone: '+44 20 7946 0958',
    defaultReportingMonths: ['September', 'January'],
    status: 'ACTIVE',
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    id: 'uni_intl_college_dundee',
    name: 'International College Dundee',
    country: 'United Kingdom',
    city: 'Dundee',
    contactName: 'Partnerships',
    contactEmail: 'partners@icdundee.ac.uk',
    contactPhone: '+44 1382 308 080',
    defaultReportingMonths: ['September', 'January', 'May'],
    status: 'ACTIVE',
    createdAt: '2026-01-12T08:00:00Z',
  },
  {
    id: 'uni_oxford_legacy',
    name: 'Oxford Academy Old Partnership',
    country: 'United Kingdom',
    city: 'Oxford',
    status: 'ARCHIVED',
    createdAt: '2025-06-01T08:00:00Z',
  },
];
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add lib/mock/mockUniversities.ts
git commit -m "feat(finance): seed mock universities for catalog"
```

---

## Task 4: Mock packages

**Goal:** Six packages covering the variety in the office CSV (bachelor/masters/foundation across two unis).

**Files:**
- Create: `lib/mock/mockPackages.ts`

- [ ] **Step 1: Create the file**

Write [lib/mock/mockPackages.ts](../../lib/mock/mockPackages.ts):

```ts
import { Package } from '@/types';

export const mockPackages: Package[] = [
  {
    id: 'pkg_coventry_bachelor_business',
    universityId: 'uni_coventry_london',
    name: 'Bachelor - Business Management',
    studyLevel: 'BACHELOR',
    program: 'Business Management',
    description: '3-year undergraduate program in London.',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-08T08:00:00Z',
    updatedAt: '2026-01-08T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_200_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 12_500, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
      { type: 'HOSTEL',      amount: 6_000, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: false },
    ],
  },
  {
    id: 'pkg_coventry_bachelor_cs',
    universityId: 'uni_coventry_london',
    name: 'Bachelor - Computer Science',
    studyLevel: 'BACHELOR',
    program: 'Computer Science',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-08T08:00:00Z',
    updatedAt: '2026-01-08T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_200_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 13_000, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
      { type: 'HOSTEL',      amount: 6_000, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: false },
    ],
  },
  {
    id: 'pkg_coventry_masters_mba',
    universityId: 'uni_coventry_london',
    name: 'Masters - MBA',
    studyLevel: 'MASTERS',
    program: 'Master of Business Administration',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-09T08:00:00Z',
    updatedAt: '2026-01-09T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_500_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 15_000, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
    ],
  },
  {
    id: 'pkg_dundee_foundation_pharma',
    universityId: 'uni_intl_college_dundee',
    name: 'Foundation - Pharmacology',
    studyLevel: 'FOUNDATION',
    program: 'Pharmacology',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'DEPOSIT',     amount: 500, currency: 'GBP', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_000_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 8_500, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
    ],
  },
  {
    id: 'pkg_dundee_foundation_mech',
    universityId: 'uni_intl_college_dundee',
    name: 'Foundation - Mechanical Engineering',
    studyLevel: 'FOUNDATION',
    program: 'Mechanical Engineering',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'DEPOSIT',     amount: 500, currency: 'GBP', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_000_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 8_500, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
    ],
  },
  {
    id: 'pkg_dundee_foundation_compeng',
    universityId: 'uni_intl_college_dundee',
    name: 'Foundation - Computer Engineering',
    studyLevel: 'FOUNDATION',
    program: 'Computer Engineering',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'DEPOSIT',     amount: 500, currency: 'GBP', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_000_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 8_500, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
    ],
  },
];

export function getActivePackagesForUniversity(universityId: string): Package[] {
  return mockPackages.filter(p => p.universityId === universityId && p.status === 'ACTIVE');
}

export function getPackageById(packageId: string): Package | undefined {
  return mockPackages.find(p => p.id === packageId);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add lib/mock/mockPackages.ts
git commit -m "feat(finance): seed mock packages with multi-currency fee defaults"
```

---

## Task 5: Mock fee ledgers (migration + fresh)

**Goal:** Migrate the **15** existing `PaymentRecord` mocks into `StudentFeeLedger` shape, plus add 3 fresh ledgers linked to packages to exercise the package-driven path.

**Files:**
- Create: `lib/mock/mockFeeLedgers.ts`
- Create (temporary, deleted at end of task): `scripts/generate-fee-ledgers.ts`

**Important:** Do NOT delete `lib/mock/mockPayments.ts` yet - that happens in the final cleanup task (Task 21). We keep both files temporarily so the codebase keeps compiling while we migrate consumers one at a time.

- [ ] **Step 1: Read the existing `mockPayments.ts`**

Run: `grep -c '^    id: "pay_' lib/mock/mockPayments.ts`

Expected: `15`. If the count differs, adjust the rest of this task accordingly.

- [ ] **Step 2: Create the file**

Write [lib/mock/mockFeeLedgers.ts](../../lib/mock/mockFeeLedgers.ts).

This file is the 1:1 migration of `mockPayments.ts` plus three new ledgers. For each old record, build a `StudentFeeLedger` with one `FeeLine` per non-zero fee. Migration rules from the spec:

- Currency: `'TZS'` (legacy was single-currency TZS)
- `packageId`: `undefined` for migrated records
- `currencyDisplay`: `'TZS'`
- `FeeLine.dueDate` back-fill:
  - AGENCY → student creation date + 30 days
  - APPLICATION → student creation date + 30 days
  - TUITION / HOSTEL → student.targetIntake or creation date + 90 days, whichever is later in the future
- `FeeLine.status`:
  - `paidAmount === 0` → `UNPAID`
  - `0 < paidAmount < amount` → `PARTIAL`
  - `paidAmount >= amount` → `PAID`
  - (Phase 1 leaves OVERDUE/WAIVED untouched at seed time; status compute happens at render-time later via a helper. For seed simplicity, mark anything matching above as UNPAID/PARTIAL/PAID.)

```ts
import { StudentFeeLedger } from '@/types';

/**
 * Phase 1 seed data.
 *
 * Entries 1-7 are 1:1 migrations of the legacy `mockPayments.ts` records
 * (TZS-only, no package linked). The migration follows the rules captured in
 * the design spec: 2026-05-26-finance-phase-1-fee-structures-and-packages-design.md
 *
 * Entries 8-10 exercise the new package-driven flow (mixed currencies,
 * sourceFeeDefaultIndex set, and one override).
 */
export const mockFeeLedgers: StudentFeeLedger[] = [
  // ---- Migrated from pay_001 (Ali Hassan) ----
  {
    studentId: 'std_003',
    packageId: undefined,
    currencyDisplay: 'TZS',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
    lines: [
      { id: 'fl_pay_001_agency',      type: 'AGENCY',      label: 'Agency Fee',      amount: 1_000_000,  currency: 'TZS', dueDate: '2026-02-14T00:00:00Z', paidAmount: 500_000, status: 'PARTIAL' },
      { id: 'fl_pay_001_application', type: 'APPLICATION', label: 'Application Fee', amount: 500_000,    currency: 'TZS', dueDate: '2026-02-14T00:00:00Z', paidAmount: 0,       status: 'UNPAID'  },
      { id: 'fl_pay_001_tuition',     type: 'TUITION',     label: 'Tuition',         amount: 15_000_000, currency: 'TZS', dueDate: '2026-04-15T00:00:00Z', paidAmount: 0,       status: 'UNPAID'  },
      { id: 'fl_pay_001_hostel',      type: 'HOSTEL',      label: 'Accommodation',   amount: 5_000_000,  currency: 'TZS', dueDate: '2026-04-15T00:00:00Z', paidAmount: 0,       status: 'UNPAID'  },
    ],
  },
  // ---- Migrated from pay_002 (Fatima Ali) ----
  {
    studentId: 'std_004',
    packageId: undefined,
    currencyDisplay: 'TZS',
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-02-05T00:00:00Z',
    lines: [
      { id: 'fl_pay_002_agency',      type: 'AGENCY',      label: 'Agency Fee',      amount: 1_200_000,  currency: 'TZS', dueDate: '2026-02-24T00:00:00Z', paidAmount: 1_200_000, status: 'PAID'    },
      { id: 'fl_pay_002_application', type: 'APPLICATION', label: 'Application Fee', amount: 600_000,    currency: 'TZS', dueDate: '2026-02-24T00:00:00Z', paidAmount: 600_000,   status: 'PAID'    },
      { id: 'fl_pay_002_tuition',     type: 'TUITION',     label: 'Tuition',         amount: 18_000_000, currency: 'TZS', dueDate: '2026-04-25T00:00:00Z', paidAmount: 0,         status: 'UNPAID'  },
      { id: 'fl_pay_002_hostel',      type: 'HOSTEL',      label: 'Accommodation',   amount: 6_000_000,  currency: 'TZS', dueDate: '2026-04-25T00:00:00Z', paidAmount: 0,         status: 'UNPAID'  },
    ],
  },
  // ---- Migrated from pay_003 (Sarah Connor) ----
  {
    studentId: 'std_006',
    packageId: undefined,
    currencyDisplay: 'TZS',
    createdAt: '2026-01-22T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
    lines: [
      { id: 'fl_pay_003_agency',      type: 'AGENCY',      label: 'Agency Fee',      amount: 1_500_000,  currency: 'TZS', dueDate: '2026-02-21T00:00:00Z', paidAmount: 1_500_000,  status: 'PAID'    },
      { id: 'fl_pay_003_application', type: 'APPLICATION', label: 'Application Fee', amount: 800_000,    currency: 'TZS', dueDate: '2026-02-21T00:00:00Z', paidAmount: 800_000,    status: 'PAID'    },
      { id: 'fl_pay_003_tuition',     type: 'TUITION',     label: 'Tuition',         amount: 25_000_000, currency: 'TZS', dueDate: '2026-04-22T00:00:00Z', paidAmount: 12_500_000, status: 'PARTIAL' },
      { id: 'fl_pay_003_hostel',      type: 'HOSTEL',      label: 'Accommodation',   amount: 8_000_000,  currency: 'TZS', dueDate: '2026-04-22T00:00:00Z', paidAmount: 0,          status: 'UNPAID'  },
    ],
  },
  // ---- Continue this pattern for pay_004 through pay_007 ----
  //
  // Build each entry by reading the corresponding object in lib/mock/mockPayments.ts
  // and applying these rules:
  //   - Skip a FeeLine if the corresponding *Fee on the old record is 0
  //   - currency = 'TZS' for all migrated lines
  //   - dueDate = createdAt + 30 days for AGENCY & APPLICATION
  //   - dueDate = createdAt + 90 days for TUITION & HOSTEL
  //   - status = PAID if paidAmount >= amount, PARTIAL if 0 < paidAmount < amount, UNPAID if 0
  //   - id = `fl_pay_00X_<type-lowercase>`
  //   - studentId, createdAt, updatedAt copy from the matching mockStudents.ts record
  //     where possible; otherwise from old record's lastPaymentDate
  //
  // Once entries 4-7 are added, append the three new ledgers below.

  // ---- Fresh ledger 1: brand new enrollment via the Coventry Business package ----
  {
    studentId: 'std_001', // existing first student - link them to the package
    packageId: 'pkg_coventry_bachelor_business',
    currencyDisplay: 'TZS',
    createdAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-04-10T09:00:00Z',
    lines: [
      { id: 'fl_pkg_001_app',     type: 'APPLICATION', label: 'Application Fee', amount: 500,       currency: 'USD', dueDate: '2026-04-10T09:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 0 },
      { id: 'fl_pkg_001_agency',  type: 'AGENCY',      label: 'Agency Fee',      amount: 1_200_000, currency: 'TZS', dueDate: '2026-05-10T09:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 1 },
      { id: 'fl_pkg_001_tuition', type: 'TUITION',     label: 'Tuition',         amount: 12_500,    currency: 'GBP', dueDate: '2026-09-01T00:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 2 },
      { id: 'fl_pkg_001_hostel',  type: 'HOSTEL',      label: 'Accommodation',   amount: 6_000,     currency: 'GBP', dueDate: '2026-09-01T00:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 3 },
    ],
  },
  // ---- Fresh ledger 2: PARTIAL mixed-currency ----
  {
    studentId: 'std_002',
    packageId: 'pkg_dundee_foundation_pharma',
    currencyDisplay: 'TZS',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-04-20T08:00:00Z',
    lines: [
      { id: 'fl_pkg_002_app',     type: 'APPLICATION', label: 'Application Fee', amount: 500,       currency: 'USD', dueDate: '2026-03-15T08:00:00Z', paidAmount: 500,       status: 'PAID',    sourceFeeDefaultIndex: 0 },
      { id: 'fl_pkg_002_deposit', type: 'DEPOSIT',     label: 'Deposit',         amount: 500,       currency: 'GBP', dueDate: '2026-03-15T08:00:00Z', paidAmount: 500,       status: 'PAID',    sourceFeeDefaultIndex: 1 },
      { id: 'fl_pkg_002_agency',  type: 'AGENCY',      label: 'Agency Fee',      amount: 1_000_000, currency: 'TZS', dueDate: '2026-04-14T08:00:00Z', paidAmount: 1_000_000, status: 'PAID',    sourceFeeDefaultIndex: 2 },
      { id: 'fl_pkg_002_tuition', type: 'TUITION',     label: 'Tuition',         amount: 8_500,     currency: 'GBP', dueDate: '2026-09-01T00:00:00Z', paidAmount: 2_000,     status: 'PARTIAL', sourceFeeDefaultIndex: 3 },
    ],
  },
  // ---- Fresh ledger 3: OVERRIDE applied (scholarship) ----
  {
    studentId: 'std_005',
    packageId: 'pkg_coventry_bachelor_cs',
    currencyDisplay: 'TZS',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
    lines: [
      { id: 'fl_pkg_003_app',     type: 'APPLICATION', label: 'Application Fee', amount: 500,       currency: 'USD', dueDate: '2026-04-01T08:00:00Z', paidAmount: 500, status: 'PAID',   sourceFeeDefaultIndex: 0 },
      { id: 'fl_pkg_003_agency',  type: 'AGENCY',      label: 'Agency Fee',      amount: 1_200_000, currency: 'TZS', dueDate: '2026-05-01T08:00:00Z', paidAmount: 0,   status: 'UNPAID', sourceFeeDefaultIndex: 1 },
      // overridden - scholarship 10%
      {
        id: 'fl_pkg_003_tuition', type: 'TUITION', label: 'Tuition', amount: 11_700, currency: 'GBP',
        dueDate: '2026-09-01T00:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 2,
        overrideReason: '10% scholarship - academic merit',
        overriddenById: 'usr_004',
        overriddenByName: 'Esther (Finance)',
        overriddenAt: '2026-04-15T10:00:00Z',
      },
      { id: 'fl_pkg_003_hostel', type: 'HOSTEL', label: 'Accommodation', amount: 6_000, currency: 'GBP', dueDate: '2026-09-01T00:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 3 },
    ],
  },
];

/** Find the ledger for a given student. */
export function getFeeLedgerForStudent(studentId: string): StudentFeeLedger | undefined {
  return mockFeeLedgers.find(l => l.studentId === studentId);
}
```

- [ ] **Step 3: Write the one-off generator script**

Create a TEMPORARY script that reads `mockPayments.ts` at runtime and prints the migrated ledger array. It SKIPS 3 specific records (`pay_005`, `pay_006`, `pay_007` - students `std_005`, `std_001`, `std_002` - which have no payment history yet and will get fresh package-driven ledgers instead). This will be run once, its output pasted into `mockFeeLedgers.ts`, then deleted.

Create `scripts/generate-fee-ledgers.ts`:

```ts
import { mockPayments } from '../lib/mock/mockPayments';
import { StudentFeeLedger, FeeLine, FeeType } from '../types';

// Students that will receive fresh package-driven ledgers - skip in migration.
const SKIP_STUDENT_IDS = new Set(['std_001', 'std_002', 'std_005']);

const ADD_DAYS = (iso: string | undefined, days: number): string => {
  const base = iso ? new Date(iso) : new Date('2026-01-15T00:00:00Z');
  base.setDate(base.getDate() + days);
  return base.toISOString();
};

const statusFor = (amount: number, paid: number) =>
  paid >= amount ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';

const buildLine = (
  payId: string,
  type: FeeType,
  label: string,
  amount: number,
  paid: number,
  dueDate: string,
): FeeLine | null => {
  if (amount === 0) return null;
  return {
    id: `fl_${payId}_${type.toLowerCase()}`,
    type,
    label,
    amount,
    currency: 'TZS',
    dueDate,
    paidAmount: paid,
    status: statusFor(amount, paid) as FeeLine['status'],
  };
};

const ledgers: StudentFeeLedger[] = mockPayments
  .filter(p => !SKIP_STUDENT_IDS.has(p.studentId))
  .map(p => {
    const baseDate = p.lastPaymentDate ?? '2026-01-15T00:00:00Z';
    const earlyDue = ADD_DAYS(baseDate, 30);
    const lateDue = ADD_DAYS(baseDate, 90);

    const lines = [
      buildLine(p.id, 'AGENCY',      'Agency Fee',      p.agencyFee,      p.agencyFeePaid,      earlyDue),
      buildLine(p.id, 'APPLICATION', 'Application Fee', p.applicationFee, p.applicationFeePaid, earlyDue),
      buildLine(p.id, 'TUITION',     'Tuition',         p.tuitionFee,     p.tuitionFeePaid,     lateDue),
      buildLine(p.id, 'HOSTEL',      'Accommodation',   p.hostelFee,      p.hostelFeePaid,      lateDue),
    ].filter((l): l is FeeLine => l !== null);

    return {
      studentId: p.studentId,
      packageId: undefined,
      currencyDisplay: 'TZS',
      lines,
      createdAt: baseDate,
      updatedAt: baseDate,
    };
  });

console.log(JSON.stringify(ledgers, null, 2));
```

- [ ] **Step 4: Run the script and capture output**

Run: `npx --yes tsx scripts/generate-fee-ledgers.ts > /tmp/migrated-ledgers.json`

Verify: `head -50 /tmp/migrated-ledgers.json` shows valid JSON.

- [ ] **Step 5: Paste output into `mockFeeLedgers.ts`**

Open `lib/mock/mockFeeLedgers.ts`. Replace the three hand-written `// ---- Migrated from pay_00X ----` blocks AND the placeholder comment with the full JSON output:

1. Delete every entry from `// ---- Migrated from pay_001 ...` through the line containing `// Once entries 4-7 are added, append the three new ledgers below.`
2. Paste the JSON output between the opening `[` and the line starting with `// ---- Fresh ledger 1:`
3. Strip the outermost `[` and `]` from the pasted JSON (they were emitted by the script; the surrounding TypeScript already has them)

After pasting, the file should have **15** ledger entries total:
- 12 migrated entries (from records where student is NOT in `SKIP_STUDENT_IDS`)
- 3 fresh package-driven entries (for `std_001`, `std_002`, `std_005`)

- [ ] **Step 6: Delete the generator script**

Run: `rm scripts/generate-fee-ledgers.ts && rmdir scripts 2>/dev/null || true`

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 8: Sanity-check counts**

Run: `grep -c '"studentId"' lib/mock/mockFeeLedgers.ts`
Expected: `15` (12 migrated + 3 fresh).

Run: `grep -c 'packageId:' lib/mock/mockFeeLedgers.ts`
Expected: at least `15` (every entry has a packageId field - 12 undefined, 3 with a value).

- [ ] **Step 9: Commit**

```bash
git add lib/mock/mockFeeLedgers.ts
git commit -m "feat(finance): seed migrated + fresh student fee ledgers"
```

---

## Task 6: Catalog validation schemas

**Goal:** zod schemas for University and Package CRUD, plus FeeLine override.

**Files:**
- Create: `lib/validations/catalog.ts`

- [ ] **Step 1: Create the file**

Write [lib/validations/catalog.ts](../../lib/validations/catalog.ts):

```ts
import { z } from 'zod';

export const CURRENCY = z.enum(['TZS', 'USD', 'GBP', 'EUR']);
export const STUDY_LEVEL = z.enum(['FOUNDATION', 'BACHELOR', 'MASTERS', 'PHD', 'DIPLOMA']);
export const FEE_TYPE = z.enum([
  'APPLICATION', 'TUITION', 'HOSTEL', 'AGENCY',
  'DEPOSIT', 'INSURANCE', 'VISA', 'AIRPORT_PICKUP', 'OTHER',
]);

const feeDueRuleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('DAYS_FROM_ENROLLMENT'), days: z.coerce.number().int().min(0) }),
  z.object({ kind: z.literal('BEFORE_REPORTING_DATE'), days: z.coerce.number().int().min(0) }),
  z.object({ kind: z.literal('ON_ENROLLMENT') }),
  z.object({ kind: z.literal('CUSTOM') }),
]);

const feeDefaultSchema = z.object({
  type: FEE_TYPE,
  label: z.string().max(80).optional(),
  amount: z.coerce.number().positive('Amount must be > 0'),
  currency: CURRENCY,
  dueRule: feeDueRuleSchema,
  required: z.coerce.boolean(),
});

export const universitySchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  country: z.string().min(2, 'Country is required').max(60),
  city: z.string().max(60).optional(),
  contactName: z.string().max(80).optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().max(40).optional(),
});

export const packageSchema = z.object({
  universityId: z.string().min(2, 'University is required'),
  name: z.string().min(2, 'Name is required').max(120),
  studyLevel: STUDY_LEVEL,
  program: z.string().min(2, 'Program is required').max(120),
  description: z.string().max(500).optional(),
  feeDefaults: z.array(feeDefaultSchema).refine(
    items => {
      const keys = items.map(i => `${i.type}::${i.label ?? ''}`);
      return new Set(keys).size === keys.length;
    },
    { message: 'Duplicate (type, label) entry' },
  ),
});

export const overrideFeeLineSchema = z.object({
  studentId: z.string().min(2),
  lineId: z.string().min(2),
  amount: z.coerce.number().positive().optional(),
  currency: CURRENCY.optional(),
  dueDate: z.string().min(10).optional(),
  reason: z.string().min(3, 'Reason is required').max(200),
});

export type UniversityFormValues = z.infer<typeof universitySchema>;
export type PackageFormValues = z.infer<typeof packageSchema>;
export type OverrideFeeLineValues = z.infer<typeof overrideFeeLineSchema>;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add lib/validations/catalog.ts
git commit -m "feat(finance): add zod schemas for catalog and fee line override"
```

---

## Task 7: Catalog server actions

**Goal:** All server-side CRUD for Universities, Packages, and package assignment to students.

**Files:**
- Create: `lib/actions/catalogActions.ts`

- [ ] **Step 1: Create the file**

Write [lib/actions/catalogActions.ts](../../lib/actions/catalogActions.ts):

```ts
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
      // Author must set per-student; default to enrollment + 90 days
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
        message: `Cannot archive - ${activePackages.length} active package(s) exist. Archive packages first.`,
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
  // feeDefaults arrive as JSON in a single field for simplicity
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/catalogActions.ts
git commit -m "feat(finance): add catalog server actions (CRUD + assign/reassign)"
```

---

## Task 8: Fee line server actions

**Goal:** Override and status-update server actions for individual `FeeLine`s.

**Files:**
- Create: `lib/actions/feeLineActions.ts` (this is the file the legacy `paymentActions.ts` will be replaced by; we leave `paymentActions.ts` untouched until the cleanup task)

- [ ] **Step 1: Create the file**

Write [lib/actions/feeLineActions.ts](../../lib/actions/feeLineActions.ts):

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { mockFeeLedgers, getFeeLedgerForStudent } from '../mock/mockFeeLedgers';
import { mockAuditLogs } from '../mock/mockAuditLogs';
import { ActionResult, FeeLineStatus } from '@/types';
import { overrideFeeLineSchema } from '../validations/catalog';

const STATUSES: FeeLineStatus[] = ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED'];

function logFeeLedger(action: 'UPDATE', detail: string, studentId: string, previousValue?: string, newValue?: string) {
  mockAuditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: 'usr_system',
    userName: 'System',
    userRole: 'FINANCE',
    action,
    module: 'FEE_LEDGER',
    detail,
    entityId: studentId,
    entityType: 'StudentFeeLedger',
    previousValue,
    newValue,
    timestamp: new Date().toISOString(),
  });
}

export async function updateFeeLineStatus(
  studentId: string,
  lineId: string,
  newStatus: string,
): Promise<ActionResult> {
  if (!STATUSES.includes(newStatus as FeeLineStatus)) {
    return { success: false, message: 'Invalid status.' };
  }
  const ledger = getFeeLedgerForStudent(studentId);
  if (!ledger) return { success: false, message: 'No fee ledger found for this student.' };
  const line = ledger.lines.find(l => l.id === lineId);
  if (!line) return { success: false, message: 'Fee line not found.' };

  const before = line.status;
  line.status = newStatus as FeeLineStatus;
  ledger.updatedAt = new Date().toISOString();
  logFeeLedger('UPDATE', `Fee line status ${before} → ${newStatus}`, studentId, before, newStatus);

  revalidatePath('/payments');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/finance');
  return { success: true, message: `Status updated to ${newStatus.toLowerCase()}.` };
}

export async function overrideFeeLine(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = overrideFeeLineSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors };
  }
  const { studentId, lineId, amount, currency, dueDate, reason } = parsed.data;

  const ledger = getFeeLedgerForStudent(studentId);
  if (!ledger) return { success: false, message: 'No fee ledger found.' };
  const line = ledger.lines.find(l => l.id === lineId);
  if (!line) return { success: false, message: 'Fee line not found.' };

  if (line.status === 'PAID') {
    return { success: false, message: 'Cannot override a paid line.' };
  }

  const before = JSON.stringify(line);
  if (amount !== undefined) line.amount = amount;
  if (currency !== undefined) line.currency = currency;
  if (dueDate !== undefined) line.dueDate = dueDate;
  line.overrideReason = reason;
  line.overriddenById = 'usr_current';
  line.overriddenByName = 'Finance';
  line.overriddenAt = new Date().toISOString();
  ledger.updatedAt = new Date().toISOString();
  logFeeLedger('UPDATE', `Fee line overridden - reason: ${reason}`, studentId, before, JSON.stringify(line));

  revalidatePath('/payments');
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: 'Fee line overridden.' };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/feeLineActions.ts
git commit -m "feat(finance): add fee line override and status actions"
```

---

## Task 9: Catalog tab in FinanceSubNav

**Goal:** Make the new Catalog route accessible from the Finance sub-navigation.

**Files:**
- Modify: `app/(dashboard)/finance/_components/FinanceSubNav.tsx`

- [ ] **Step 1: Insert the Catalog tab**

Edit [app/(dashboard)/finance/_components/FinanceSubNav.tsx](../../app/(dashboard)/finance/_components/FinanceSubNav.tsx).

Replace the import line that includes `LayoutGrid` with one that also imports `BookOpen`:

```ts
import { LayoutGrid, FileText, Wallet, Users, Receipt, CreditCard, BookOpen } from 'lucide-react';
```

Replace the `tabs` array with:

```ts
const tabs = [
  { label: 'Overview', href: '/finance', icon: LayoutGrid, exact: true },
  { label: 'Catalog', href: '/finance/catalog', icon: BookOpen },
  { label: 'Petty Cash', href: '/finance/petty-cash', icon: Wallet },
  { label: 'Invoices', href: '/finance/invoices', icon: FileText },
  { label: 'Payroll', href: '/finance/payroll', icon: Users },
  { label: 'Expenses', href: '/finance/expenses', icon: Receipt },
  { label: 'Student Payments', href: '/payments', icon: CreditCard, external: true },
];
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/finance/_components/FinanceSubNav.tsx
git commit -m "feat(finance): add Catalog tab to FinanceSubNav"
```

---

## Task 10: Catalog page shell + university list

**Goal:** A first version of the Catalog page that renders the universities list. Selection state is a URL search-param so we can keep this a server component as much as possible. The "selected university" pane is empty for now and gets filled in Task 11.

**Files:**
- Create: `app/(dashboard)/finance/catalog/page.tsx`
- Create: `app/(dashboard)/finance/catalog/_components/UniversityList.tsx`
- Create: `app/(dashboard)/finance/catalog/_components/CatalogActions.tsx`

- [ ] **Step 1: Catalog page**

Write [app/(dashboard)/finance/catalog/page.tsx](../../app/(dashboard)/finance/catalog/page.tsx):

```tsx
import { PageHeader } from '@/components/shared/PageHeader';
import { mockUniversities } from '@/lib/mock/mockUniversities';
import { getActivePackagesForUniversity, mockPackages } from '@/lib/mock/mockPackages';
import { mockFeeLedgers } from '@/lib/mock/mockFeeLedgers';
import { UniversityList } from './_components/UniversityList';
import { PackageList } from './_components/PackageList';
import { BookOpen } from 'lucide-react';

interface CatalogPageProps {
  searchParams: Promise<{ uni?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { uni } = await searchParams;
  const activeUnis = mockUniversities.filter(u => u.status === 'ACTIVE');
  const selectedUniId = uni ?? activeUnis[0]?.id;
  const selectedUni = mockUniversities.find(u => u.id === selectedUniId);

  // Decorate with package count
  const studentCountByPackage = new Map<string, number>();
  for (const l of mockFeeLedgers) {
    if (l.packageId) studentCountByPackage.set(l.packageId, (studentCountByPackage.get(l.packageId) ?? 0) + 1);
  }
  const universities = mockUniversities.map(u => ({
    ...u,
    packageCount: mockPackages.filter(p => p.universityId === u.id && p.status === 'ACTIVE').length,
  }));

  const packagesForSelected = selectedUni
    ? getActivePackagesForUniversity(selectedUni.id).map(p => ({
        ...p,
        studentCount: studentCountByPackage.get(p.id) ?? 0,
      }))
    : [];

  return (
    <>
      <PageHeader
        title="Catalog"
        description="Universities and package offers. Marketing picks from here when enrolling a student."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4">
          <UniversityList universities={universities} selectedId={selectedUniId} />
        </aside>
        <section className="lg:col-span-8">
          {selectedUni ? (
            <PackageList university={selectedUni} packages={packagesForSelected} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900">No universities yet</p>
              <p className="text-xs text-gray-500 mt-1">Create one from the left pane to start building the catalog.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
```

- [ ] **Step 2: UniversityList component**

Write [app/(dashboard)/finance/catalog/_components/UniversityList.tsx](../../app/(dashboard)/finance/catalog/_components/UniversityList.tsx):

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { University } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Building2 } from 'lucide-react';
import { UniversityForm } from './UniversityForm';

interface Props {
  universities: Array<University & { packageCount: number }>;
  selectedId?: string;
}

export function UniversityList({ universities, selectedId }: Props) {
  const [showArchived, setShowArchived] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const filtered = universities.filter(u => (showArchived ? true : u.status === 'ACTIVE'));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">Universities</h3>
        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>
      <label className="flex items-center gap-2 px-4 py-2 text-[11px] text-gray-500 border-b border-gray-100">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={e => setShowArchived(e.target.checked)}
        />
        Show archived
      </label>
      <ul className="divide-y divide-gray-100">
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-gray-400">No universities.</li>
        )}
        {filtered.map(u => (
          <li key={u.id}>
            <Link
              href={`/finance/catalog?uni=${u.id}`}
              className={cn(
                'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                u.id === selectedId && 'bg-primary-muted/40',
              )}
            >
              <div className="w-9 h-9 rounded-md bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {u.name}
                  {u.status === 'ARCHIVED' && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      Archived
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {u.country}
                  {u.city ? ` · ${u.city}` : ''} · {u.packageCount} package{u.packageCount === 1 ? '' : 's'}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {openCreate && <UniversityForm mode="create" onClose={() => setOpenCreate(false)} />}
    </div>
  );
}
```

- [ ] **Step 3: CatalogActions placeholder (used later by PackageList)**

Write [app/(dashboard)/finance/catalog/_components/CatalogActions.tsx](../../app/(dashboard)/finance/catalog/_components/CatalogActions.tsx):

```tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { setUniversityStatus, setPackageStatus, duplicatePackage } from '@/lib/actions/catalogActions';
import { ActionResult, CatalogStatus } from '@/types';

interface Props {
  kind: 'university' | 'package';
  id: string;
  status: CatalogStatus;
}

export function ArchiveRestoreButton({ kind, id, status }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const nextStatus: CatalogStatus = status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
  const label = nextStatus === 'ARCHIVED' ? 'Archive' : 'Restore';

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const action = kind === 'university' ? setUniversityStatus : setPackageStatus;
          const result: ActionResult = await action(id, nextStatus);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
          router.refresh();
        });
      }}
      className="text-xs font-medium text-gray-600 hover:text-gray-900"
    >
      {pending ? '…' : label}
    </button>
  );
}

export function DuplicatePackageButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await duplicatePackage(id);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
          router.refresh();
        });
      }}
      className="text-xs font-medium text-gray-600 hover:text-gray-900"
    >
      {pending ? '…' : 'Duplicate'}
    </button>
  );
}
```

- [ ] **Step 4: Typecheck (will fail on UniversityForm + PackageList - that's expected; next task creates them)**

Run: `npm run typecheck`
Expected: errors mentioning `UniversityForm` and `PackageList` cannot be found. These are produced in Tasks 11 and 12 below.

- [ ] **Step 5: Defer commit until Task 12**

We will commit after UniversityForm + PackageList exist, otherwise the build is broken.

---

## Task 11: UniversityForm component

**Goal:** A SlideInPanel/Dialog-based form to create or edit a University.

**Files:**
- Create: `app/(dashboard)/finance/catalog/_components/UniversityForm.tsx`

- [ ] **Step 1: Create the file**

Write [app/(dashboard)/finance/catalog/_components/UniversityForm.tsx](../../app/(dashboard)/finance/catalog/_components/UniversityForm.tsx):

```tsx
'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createUniversity, updateUniversity } from '@/lib/actions/catalogActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { University, ActionResult } from '@/types';

interface Props {
  mode: 'create' | 'edit';
  university?: University;
  onClose: () => void;
}

export function UniversityForm({ mode, university, onClose }: Props) {
  const router = useRouter();

  const action = async (_prev: unknown, formData: FormData): Promise<ActionResult> => {
    if (mode === 'edit' && university) return updateUniversity(university.id, formData);
    return createUniversity(_prev, formData);
  };

  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.message);
      onClose();
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, onClose, router]);

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New University' : `Edit ${university?.name}`}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-2">
          <Field name="name" label="Name *" defaultValue={university?.name} errors={state?.errors?.name} />
          <Field name="country" label="Country *" defaultValue={university?.country} errors={state?.errors?.country} />
          <Field name="city" label="City" defaultValue={university?.city} errors={state?.errors?.city} />
          <Field name="contactName" label="Contact name" defaultValue={university?.contactName} errors={state?.errors?.contactName} />
          <Field name="contactEmail" label="Contact email" type="email" defaultValue={university?.contactEmail} errors={state?.errors?.contactEmail} />
          <Field name="contactPhone" label="Contact phone" defaultValue={university?.contactPhone} errors={state?.errors?.contactPhone} />

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  name, label, defaultValue, errors, type = 'text',
}: {
  name: string;
  label: string;
  defaultValue?: string;
  errors?: string[];
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ''} />
      {errors && <p className="text-red-500 text-xs">{errors[0]}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify dialog imports exist**

Run: `grep -l "DialogContent\|DialogHeader\|DialogTitle" components/ui/dialog.tsx`
Expected: the file should export these. If it doesn't, open `components/ui/dialog.tsx` and add the exports.

- [ ] **Step 3: Typecheck (still fails until PackageList exists)**

Run: `npm run typecheck`
Expected: errors mentioning `PackageList`.

---

## Task 12: PackageList + PackageForm + FeeDefaultsEditor + PackageEditConfirmDialog

**Goal:** The right pane of the catalog page - list packages for selected university, with create/edit flows.

**Files:**
- Create: `app/(dashboard)/finance/catalog/_components/PackageList.tsx`
- Create: `app/(dashboard)/finance/catalog/_components/PackageForm.tsx`
- Create: `app/(dashboard)/finance/catalog/_components/FeeDefaultsEditor.tsx`
- Create: `app/(dashboard)/finance/catalog/_components/PackageEditConfirmDialog.tsx`

- [ ] **Step 1: FeeDefaultsEditor**

Write [app/(dashboard)/finance/catalog/_components/FeeDefaultsEditor.tsx](../../app/(dashboard)/finance/catalog/_components/FeeDefaultsEditor.tsx):

```tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FeeDefault, FeeType, Currency, FeeDueRule } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const FEE_TYPES: FeeType[] = ['APPLICATION', 'TUITION', 'HOSTEL', 'AGENCY', 'DEPOSIT', 'INSURANCE', 'VISA', 'AIRPORT_PICKUP', 'OTHER'];
const CURRENCIES: Currency[] = ['TZS', 'USD', 'GBP', 'EUR'];
const DUE_RULES: FeeDueRule['kind'][] = ['ON_ENROLLMENT', 'DAYS_FROM_ENROLLMENT', 'BEFORE_REPORTING_DATE', 'CUSTOM'];

interface Props {
  initial?: FeeDefault[];
  name: string; // hidden input name; we serialize as JSON
}

export function FeeDefaultsEditor({ initial = [], name }: Props) {
  const [rows, setRows] = useState<FeeDefault[]>(initial);

  const update = (idx: number, patch: Partial<FeeDefault>) => {
    setRows(rs => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const remove = (idx: number) => setRows(rs => rs.filter((_, i) => i !== idx));
  const add = () =>
    setRows(rs => [
      ...rs,
      { type: 'TUITION', amount: 0, currency: 'GBP', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
    ]);

  return (
    <div className="space-y-3">
      <Label>Fee Defaults</Label>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.length === 0 && (
        <p className="text-xs text-gray-500">No fees yet. Click <strong>Add fee</strong> to add the first one.</p>
      )}
      {rows.map((r, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-start border border-gray-100 rounded-md p-3">
          <div className="col-span-3">
            <Select value={r.type} onChange={e => update(idx, { type: e.target.value as FeeType })}>
              {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="col-span-3">
            <Input
              type="number"
              min={1}
              value={r.amount || ''}
              onChange={e => update(idx, { amount: Number(e.target.value) })}
              placeholder="Amount"
            />
          </div>
          <div className="col-span-2">
            <Select value={r.currency} onChange={e => update(idx, { currency: e.target.value as Currency })}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="col-span-3">
            <Select
              value={r.dueRule.kind}
              onChange={e => {
                const kind = e.target.value as FeeDueRule['kind'];
                const rule: FeeDueRule =
                  kind === 'DAYS_FROM_ENROLLMENT' || kind === 'BEFORE_REPORTING_DATE'
                    ? { kind, days: 0 }
                    : { kind };
                update(idx, { dueRule: rule });
              }}
            >
              {DUE_RULES.map(k => <option key={k} value={k}>{k.replace(/_/g, ' ').toLowerCase()}</option>)}
            </Select>
            {(r.dueRule.kind === 'DAYS_FROM_ENROLLMENT' || r.dueRule.kind === 'BEFORE_REPORTING_DATE') && (
              <Input
                type="number"
                min={0}
                value={r.dueRule.days}
                onChange={e => update(idx, { dueRule: { ...r.dueRule, days: Number(e.target.value) } as FeeDueRule })}
                placeholder="days"
                className="mt-1"
              />
            )}
          </div>
          <div className="col-span-1 flex items-center pt-1.5">
            <label className="text-xs text-gray-600 flex items-center gap-1">
              <input
                type="checkbox"
                checked={r.required}
                onChange={e => update(idx, { required: e.target.checked })}
              />
              req
            </label>
          </div>
          <button
            type="button"
            onClick={() => remove(idx)}
            className="col-span-12 text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1 self-end ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" /> Add fee
      </button>
    </div>
  );
}
```

- [ ] **Step 2: PackageEditConfirmDialog**

Write [app/(dashboard)/finance/catalog/_components/PackageEditConfirmDialog.tsx](../../app/(dashboard)/finance/catalog/_components/PackageEditConfirmDialog.tsx):

```tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  studentCount: number;
  onClose: () => void;
  onConfirm: (applyTo: 'NEW_ONLY' | 'NEW_AND_UNPAID') => void;
  pending?: boolean;
}

export function PackageEditConfirmDialog({ open, studentCount, onClose, onConfirm, pending }: Props) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply package changes to existing students?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2 text-sm text-gray-700">
          <p>
            <strong>{studentCount}</strong> student{studentCount === 1 ? ' uses' : 's use'} this
            package. How should the change be applied?
          </p>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={pending}
              onClick={() => onConfirm('NEW_ONLY')}
            >
              Apply to new enrollments only <span className="ml-1 text-gray-400">(recommended)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={pending}
              onClick={() => onConfirm('NEW_AND_UNPAID')}
            >
              Also update unpaid fee lines on existing students
            </Button>
          </div>
        </div>
        <div className="pt-3 flex items-center justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: PackageForm**

Write [app/(dashboard)/finance/catalog/_components/PackageForm.tsx](../../app/(dashboard)/finance/catalog/_components/PackageForm.tsx):

```tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createPackage, updatePackage } from '@/lib/actions/catalogActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, StudyLevel, ActionResult } from '@/types';
import { FeeDefaultsEditor } from './FeeDefaultsEditor';
import { PackageEditConfirmDialog } from './PackageEditConfirmDialog';

const STUDY_LEVELS: StudyLevel[] = ['FOUNDATION', 'BACHELOR', 'MASTERS', 'PHD', 'DIPLOMA'];

interface Props {
  mode: 'create' | 'edit';
  universityId: string;
  pkg?: Package;
  studentCount?: number;
  onClose: () => void;
}

export function PackageForm({ mode, universityId, pkg, studentCount = 0, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>();

  const submit = (formData: FormData) => {
    formData.set('universityId', universityId);
    if (mode === 'create') {
      startTransition(async () => {
        const result: ActionResult = await createPackage(null, formData);
        handleResult(result);
      });
      return;
    }
    // mode === 'edit'
    if (studentCount > 0) {
      setPendingFormData(formData);
      setConfirmOpen(true);
    } else {
      runUpdate(formData, 'NEW_ONLY');
    }
  };

  const runUpdate = (formData: FormData, applyTo: 'NEW_ONLY' | 'NEW_AND_UNPAID') => {
    if (!pkg) return;
    startTransition(async () => {
      const result = await updatePackage(pkg.id, formData, applyTo);
      handleResult(result);
    });
    setConfirmOpen(false);
  };

  const handleResult = (result: ActionResult) => {
    if (result.success) {
      toast.success(result.message);
      onClose();
      router.refresh();
    } else {
      toast.error(result.message);
      setErrors(result.errors);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={o => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New Package' : `Edit ${pkg?.name}`}</DialogTitle>
          </DialogHeader>
          <form
            action={submit}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" defaultValue={pkg?.name} placeholder="Bachelor - Business Management" />
              {errors?.name && <p className="text-red-500 text-xs">{errors.name[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="studyLevel">Level *</Label>
                <Select id="studyLevel" name="studyLevel" defaultValue={pkg?.studyLevel ?? 'BACHELOR'}>
                  {STUDY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="program">Program *</Label>
                <Input id="program" name="program" defaultValue={pkg?.program} placeholder="Business Management" />
                {errors?.program && <p className="text-red-500 text-xs">{errors.program[0]}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={pkg?.description} placeholder="Optional notes shown in the catalog." />
            </div>

            <FeeDefaultsEditor initial={pkg?.feeDefaults} name="feeDefaults" />
            {errors?.feeDefaults && <p className="text-red-500 text-xs">{errors.feeDefaults[0]}</p>}

            <div className="pt-3 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PackageEditConfirmDialog
        open={confirmOpen}
        studentCount={studentCount}
        onClose={() => setConfirmOpen(false)}
        onConfirm={applyTo => pendingFormData && runUpdate(pendingFormData, applyTo)}
        pending={pending}
      />
    </>
  );
}
```

- [ ] **Step 4: PackageList**

Write [app/(dashboard)/finance/catalog/_components/PackageList.tsx](../../app/(dashboard)/finance/catalog/_components/PackageList.tsx):

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { University, Package, StudyLevel } from '@/types';
import { Plus, Building2 } from 'lucide-react';
import { UniversityForm } from './UniversityForm';
import { PackageForm } from './PackageForm';
import { ArchiveRestoreButton, DuplicatePackageButton } from './CatalogActions';
import { formatCurrency } from '@/lib/format';

interface Props {
  university: University;
  packages: Array<Package & { studentCount: number }>;
}

const LEVEL_ORDER: StudyLevel[] = ['FOUNDATION', 'BACHELOR', 'MASTERS', 'PHD', 'DIPLOMA'];

export function PackageList({ university, packages }: Props) {
  const [editUni, setEditUni] = useState(false);
  const [newPackage, setNewPackage] = useState(false);
  const [editPackage, setEditPackage] = useState<Package & { studentCount: number } | null>(null);

  const grouped = LEVEL_ORDER
    .map(level => ({ level, items: packages.filter(p => p.studyLevel === level) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <header className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-primary-muted text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900 truncate">{university.name}</h3>
            {university.status === 'ARCHIVED' && (
              <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Archived</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {university.country}
            {university.city && ` · ${university.city}`}
            {university.contactEmail && ` · ${university.contactEmail}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setEditUni(true)} className="text-xs font-medium text-gray-600 hover:text-gray-900">Edit</button>
          <ArchiveRestoreButton kind="university" id={university.id} status={university.status} />
          <button
            onClick={() => setNewPackage(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-md hover:bg-primary-dark"
          >
            <Plus className="w-3.5 h-3.5" />
            New Package
          </button>
        </div>
      </header>

      {packages.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm font-semibold text-gray-900">No packages yet</p>
          <p className="text-xs text-gray-500 mt-1">Click <strong>New Package</strong> to add one.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {grouped.map(g => (
            <section key={g.level} className="p-5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">{g.level}</h4>
              <ul className="space-y-2">
                {g.items.map(pkg => (
                  <li key={pkg.id} className="border border-gray-100 rounded-md p-4 flex items-start justify-between gap-3 hover:shadow-card transition-shadow">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                      <p className="text-[11px] text-gray-500">{pkg.program} · {pkg.studentCount} student{pkg.studentCount === 1 ? '' : 's'}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {pkg.feeDefaults.map((d, i) => (
                          <li key={i} className="text-[10px] bg-gray-50 text-gray-700 px-1.5 py-0.5 rounded">
                            {d.type}: {formatCurrency(d.amount, { currency: d.currency })}
                            {!d.required && ' (opt)'}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Link href={`/finance/catalog/${pkg.id}`} className="text-xs font-medium text-primary hover:underline">View</Link>
                      <button onClick={() => setEditPackage(pkg)} className="text-xs font-medium text-gray-600 hover:text-gray-900">Edit</button>
                      <DuplicatePackageButton id={pkg.id} />
                      <ArchiveRestoreButton kind="package" id={pkg.id} status={pkg.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editUni && <UniversityForm mode="edit" university={university} onClose={() => setEditUni(false)} />}
      {newPackage && <PackageForm mode="create" universityId={university.id} onClose={() => setNewPackage(false)} />}
      {editPackage && <PackageForm mode="edit" universityId={university.id} pkg={editPackage} studentCount={editPackage.studentCount} onClose={() => setEditPackage(null)} />}
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 7: Commit (covers Tasks 10–12 together)**

```bash
git add app/\(dashboard\)/finance/catalog
git commit -m "feat(finance): add Catalog page with university and package management"
```

---

## Task 13: Package detail page

**Goal:** A simple detail view at `/finance/catalog/[packageId]` showing fees and assigned students.

**Files:**
- Create: `app/(dashboard)/finance/catalog/[packageId]/page.tsx`

- [ ] **Step 1: Create the file**

Write [app/(dashboard)/finance/catalog/[packageId]/page.tsx](../../app/(dashboard)/finance/catalog/[packageId]/page.tsx):

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPackageById } from '@/lib/mock/mockPackages';
import { mockUniversities } from '@/lib/mock/mockUniversities';
import { mockFeeLedgers } from '@/lib/mock/mockFeeLedgers';
import { mockStudents } from '@/lib/mock/mockStudents';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/shared/PageHeader';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ packageId: string }>;
}

export default async function PackageDetailPage({ params }: Props) {
  const { packageId } = await params;
  const pkg = getPackageById(packageId);
  if (!pkg) notFound();

  const uni = mockUniversities.find(u => u.id === pkg.universityId);
  const ledgers = mockFeeLedgers.filter(l => l.packageId === packageId);
  const linkedStudents = ledgers
    .map(l => mockStudents.find(s => s.id === l.studentId))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      <Link href={`/finance/catalog?uni=${pkg.universityId}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mb-2">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to catalog
      </Link>
      <PageHeader
        title={pkg.name}
        description={`${pkg.studyLevel} · ${pkg.program} · ${uni?.name ?? 'Unknown university'}`}
      />

      <section className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Fee Defaults</h3>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-gray-500 text-left">
            <tr>
              <th className="px-2 py-2 font-medium">Type</th>
              <th className="px-2 py-2 font-medium">Label</th>
              <th className="px-2 py-2 font-medium text-right">Amount</th>
              <th className="px-2 py-2 font-medium">Due rule</th>
              <th className="px-2 py-2 font-medium">Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pkg.feeDefaults.map((d, i) => (
              <tr key={i}>
                <td className="px-2 py-2.5 font-semibold text-gray-900">{d.type}</td>
                <td className="px-2 py-2.5 text-gray-700">{d.label ?? '-'}</td>
                <td className="px-2 py-2.5 text-right font-bold text-gray-900">{formatCurrency(d.amount, { currency: d.currency })}</td>
                <td className="px-2 py-2.5 text-gray-700">
                  {d.dueRule.kind === 'ON_ENROLLMENT' && 'On enrollment'}
                  {d.dueRule.kind === 'DAYS_FROM_ENROLLMENT' && `${d.dueRule.days}d from enrollment`}
                  {d.dueRule.kind === 'BEFORE_REPORTING_DATE' && `${d.dueRule.days}d before reporting`}
                  {d.dueRule.kind === 'CUSTOM' && 'Custom'}
                </td>
                <td className="px-2 py-2.5 text-gray-700">{d.required ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-card p-6 mt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Students on this package ({linkedStudents.length})</h3>
        {linkedStudents.length === 0 ? (
          <p className="text-xs text-gray-500">No students enrolled with this package yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {linkedStudents.map(s => (
              <li key={s.id} className="py-2.5">
                <Link href={`/students/${s.id}`} className="text-sm font-medium text-primary hover:underline">{s.fullName}</Link>
                <p className="text-[11px] text-gray-500">{s.targetUniversity} · {s.targetProgram} · {s.pipelineStage}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/finance/catalog/\[packageId\]
git commit -m "feat(finance): add package detail page"
```

---

## Task 14: AddStudentForm - package picker

**Goal:** Marketing can pick a package while enrolling a student; the form previews fee defaults below.

**Files:**
- Modify: `app/(dashboard)/students/_components/AddStudentForm.tsx`
- Modify: `lib/actions/studentActions.ts` (to call `assignPackageToStudent` after creating the student)

- [ ] **Step 1: Inspect studentActions to find the addStudent action**

Run: `grep -n "addStudent\|export async function" lib/actions/studentActions.ts | head -20`

Note the signature.

- [ ] **Step 2: Pass packageId from the form via FormData → studentActions → assignPackageToStudent**

Edit [lib/actions/studentActions.ts](../../lib/actions/studentActions.ts). After the existing student-creation step (inside `addStudent`), add:

```ts
import { assignPackageToStudent } from './catalogActions';

// ...inside addStudent, AFTER the student has been pushed to mockStudents:
const packageId = (formData.get('packageId') as string | null) ?? '';
if (packageId) {
  await assignPackageToStudent(newStudent.id, packageId);
}
```

(Adjust the variable name `newStudent` to whatever the existing code uses for the freshly created record.)

- [ ] **Step 3: Update AddStudentForm**

Open [app/(dashboard)/students/_components/AddStudentForm.tsx](../../app/(dashboard)/students/_components/AddStudentForm.tsx).

At the top of the file, add these imports:

```ts
import { useState, useMemo } from 'react';
import { mockUniversities } from '@/lib/mock/mockUniversities';
import { mockPackages } from '@/lib/mock/mockPackages';
import { formatCurrency } from '@/lib/format';
```

Inside the component body (above the `return`), add:

```ts
const activeUniversities = useMemo(
  () => mockUniversities.filter(u => u.status === 'ACTIVE'),
  [],
);
const [selectedUniId, setSelectedUniId] = useState<string>('');
const [selectedPackageId, setSelectedPackageId] = useState<string>('');

const packagesForUni = useMemo(
  () => mockPackages.filter(p => p.universityId === selectedUniId && p.status === 'ACTIVE'),
  [selectedUniId],
);
const previewPackage = mockPackages.find(p => p.id === selectedPackageId);
```

Find the existing "Target Information" section heading (search for `target` in the file). Right above the closing `</form>` (or wherever the section logically belongs), insert this new "Package" section:

```tsx
<h3 className="font-urbanist font-bold text-lg border-b pb-2 mb-4 mt-4">Enrollment Package (optional)</h3>

<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="enrollmentUniversityId">University</Label>
    <Select
      id="enrollmentUniversityId"
      value={selectedUniId}
      onChange={e => {
        setSelectedUniId(e.target.value);
        setSelectedPackageId('');
      }}
    >
      <option value="">- Don't link to a package -</option>
      {activeUniversities.map(u => (
        <option key={u.id} value={u.id}>{u.name}</option>
      ))}
    </Select>
  </div>
  <div className="space-y-2">
    <Label htmlFor="packageId">Package</Label>
    <Select
      id="packageId"
      name="packageId"
      value={selectedPackageId}
      onChange={e => setSelectedPackageId(e.target.value)}
      disabled={!selectedUniId}
    >
      <option value="">- Select package -</option>
      {packagesForUni.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </Select>
  </div>
</div>

{previewPackage && (
  <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Fee preview</p>
    <ul className="flex flex-wrap gap-2">
      {previewPackage.feeDefaults.map((d, i) => (
        <li key={i} className="text-[11px] bg-white border border-gray-100 px-2 py-0.5 rounded">
          {d.type}: {formatCurrency(d.amount, { currency: d.currency })}
          {!d.required && ' (optional)'}
        </li>
      ))}
    </ul>
  </div>
)}
```

- [ ] **Step 4: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/\(dashboard\)/students/_components/AddStudentForm.tsx lib/actions/studentActions.ts
git commit -m "feat(finance): allow Marketing to assign a package when enrolling a student"
```

---

## Task 15: Rewrite PaymentsTab to render FeeLines

**Goal:** Replace the old `PaymentRecord`-based 4-row layout with a dynamic list of `FeeLine`s from `StudentFeeLedger`.

**Files:**
- Modify: `app/(dashboard)/students/[id]/_components/PaymentsTab.tsx`
- Modify: `lib/studentDetail.ts` (swap `payment` field for `feeLedger`)

- [ ] **Step 1: Update studentDetail.ts**

Edit [lib/studentDetail.ts](../../lib/studentDetail.ts).

Replace the top imports block:

```ts
import { Student, StudentFeeLedger, Application, TravelRecord, Document, PipelineStage } from '@/types';
import { getFeeLedgerForStudent } from './mock/mockFeeLedgers';
import { mockApplications } from './mock/mockApplications';
import { mockTravelRecords } from './mock/mockTravel';
import { mockDocuments } from './mock/mockDocuments';
```

Replace the `StudentDetail` interface:

```ts
export interface StudentDetail {
  student: Student;
  feeLedger: StudentFeeLedger | null;
  application: Application | null;
  travel: TravelRecord | null;
  documents: Document[];
  activity: ActivityEvent[];
}
```

Replace the `buildActivity` Payments block (lines ~102–144 in the original):

```ts
  // Payments - synthesized from concrete FeeLines
  if (ledger) {
    for (const line of ledger.lines) {
      if (line.paidAmount > 0) {
        events.push({
          id: `act_${student.id}_pay_${line.id}`,
          kind: 'PAYMENT',
          title: `${line.label} payment recorded`,
          description: `${line.currency} ${line.paidAmount.toLocaleString()} of ${line.amount.toLocaleString()}`,
          actor: 'Finance',
          timestamp: line.overriddenAt ?? ledger.updatedAt,
        });
      }
    }
  }
```

And rename the `payment` parameter in `buildActivity` to `ledger: StudentFeeLedger | null`. Update the call site.

Replace the bottom `getStudentDetail` function:

```ts
export function getStudentDetail(student: Student): StudentDetail {
  const feeLedger = getFeeLedgerForStudent(student.id) ?? null;
  const application = mockApplications.find(a => a.studentId === student.id) ?? null;
  const travel = mockTravelRecords.find(t => t.studentId === student.id) ?? null;
  const documents = mockDocuments.filter(d => d.studentId === student.id);
  const activity = buildActivity(student, feeLedger, application, travel, documents);

  return { student, feeLedger, application, travel, documents, activity };
}
```

- [ ] **Step 2: Find the parent that consumes `payment` and switch it to `feeLedger`**

Run: `grep -rn "getStudentDetail\|\.payment" app/\(dashboard\)/students/\[id\]/ | head -20`

For each consumer using `detail.payment`, change to `detail.feeLedger`. The detail page is at [app/(dashboard)/students/[id]/page.tsx](../../app/(dashboard)/students/[id]/page.tsx).

- [ ] **Step 3: Rewrite PaymentsTab**

Replace [app/(dashboard)/students/[id]/_components/PaymentsTab.tsx](../../app/(dashboard)/students/[id]/_components/PaymentsTab.tsx) with:

```tsx
'use client';

import { StudentFeeLedger, FeeLine, Role } from '@/types';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { sumInCurrency } from '@/lib/finance/fxRates';
import { StatusSelect } from '@/components/shared/StatusSelect';
import { FEE_LINE_STATUS_OPTIONS } from '@/lib/statusOptions';
import { updateFeeLineStatus } from '@/lib/actions/feeLineActions';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface Props {
  feeLedger: StudentFeeLedger | null;
  userRole: Role;
}

const TYPE_ICON: Record<string, string> = {
  APPLICATION: '📝',
  TUITION: '🎓',
  HOSTEL: '🏠',
  AGENCY: '🤝',
  DEPOSIT: '💰',
  INSURANCE: '🛡️',
  VISA: '📘',
  AIRPORT_PICKUP: '✈️',
  OTHER: '•',
};

export function PaymentsTab({ feeLedger, userRole }: Props) {
  if (!feeLedger) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Wallet className="w-7 h-7 text-gray-400" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">No fee ledger yet</h4>
        <p className="text-xs text-gray-500 mt-1">
          Assign a package on the student's profile to materialise fee lines.
        </p>
      </div>
    );
  }

  const display = feeLedger.currencyDisplay ?? 'TZS';
  const due = sumInCurrency(
    feeLedger.lines
      .filter(l => l.status !== 'PAID' && l.status !== 'WAIVED')
      .map(l => ({ amount: l.amount - l.paidAmount, currency: l.currency })),
    display,
  );
  const paid = sumInCurrency(
    feeLedger.lines.map(l => ({ amount: l.paidAmount, currency: l.currency })),
    display,
  );

  const canEditStatus = userRole === 'FINANCE' || userRole === 'MANAGING_DIRECTOR';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi icon={Wallet} label={`Outstanding (${display})`} value={formatCurrency(due, { currency: display })} tone="warning" />
        <Kpi icon={TrendingUp} label={`Paid to date (${display})`} value={formatCurrency(paid, { currency: display })} tone="success" />
        <Kpi icon={Sparkles} label="Lines" value={`${feeLedger.lines.length}`} tone="default" />
      </div>

      <ul className="space-y-2">
        {feeLedger.lines.map(line => (
          <FeeLineRow key={line.id} line={line} canEdit={canEditStatus} studentId={feeLedger.studentId} />
        ))}
      </ul>
    </div>
  );
}

function FeeLineRow({
  line,
  canEdit,
  studentId,
}: {
  line: FeeLine;
  canEdit: boolean;
  studentId: string;
}) {
  const pct = line.amount > 0 ? Math.min(100, Math.round((line.paidAmount / line.amount) * 100)) : 0;
  const isPaid = line.status === 'PAID';
  const isOverridden = !!line.overrideReason;
  return (
    <li className="rounded-lg border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base" aria-hidden>{TYPE_ICON[line.type] ?? '•'}</span>
            <p className="text-sm font-semibold text-gray-900">{line.label}</p>
            {isOverridden && (
              <span
                title={`${line.overrideReason} - by ${line.overriddenByName ?? 'Finance'} on ${line.overriddenAt ? formatDate(line.overriddenAt) : 'unknown date'}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded"
              >
                <AlertTriangle className="w-3 h-3" /> Adjusted
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500">Due {formatDate(line.dueDate)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(line.paidAmount, { currency: line.currency })}
          </p>
          <p className="text-[11px] text-gray-500">of {formatCurrency(line.amount, { currency: line.currency })}</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${isPaid ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-primary-light'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-[11px] text-gray-500 font-medium">{pct}% paid</p>
        <StatusSelect
          value={line.status}
          options={FEE_LINE_STATUS_OPTIONS}
          editable={canEdit}
          action={async next => updateFeeLineStatus(studentId, line.id, next)}
          size="sm"
        />
      </div>
    </li>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: 'default' | 'success' | 'warning' }) {
  const tones = {
    default: 'bg-gray-50 text-gray-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
  }[tone];
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-base font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-7 h-7 rounded-md ${tones} flex items-center justify-center shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck (will fail until Task 16 adds FEE_LINE_STATUS_OPTIONS)**

Run: `npm run typecheck`
Expected: error on `FEE_LINE_STATUS_OPTIONS` import. That's expected; next task fixes it.

---

## Task 16: statusOptions - add FEE_LINE_STATUS_OPTIONS, remove PAYMENT_STATUS_OPTIONS

**Goal:** Status pill options for `FeeLineStatus`, and remove the now-unused `PAYMENT_STATUS_OPTIONS`.

**Files:**
- Modify: `lib/statusOptions.ts`

- [ ] **Step 1: Edit the file**

In [lib/statusOptions.ts](../../lib/statusOptions.ts), replace the `PAYMENT_STATUS_OPTIONS` block with:

```ts
export const FEE_LINE_STATUS_OPTIONS: StatusOption[] = [
  { value: 'UNPAID',  label: 'Unpaid',  className: 'bg-gray-50 text-gray-700 border border-gray-200' },
  { value: 'PARTIAL', label: 'Partial', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'PAID',    label: 'Paid',    className: 'bg-green-50 text-green-700 border border-green-200' },
  { value: 'OVERDUE', label: 'Overdue', className: 'bg-red-50 text-red-700 border border-red-200' },
  { value: 'WAIVED',  label: 'Waived',  className: 'bg-gray-100 text-gray-500 border border-gray-200 line-through' },
];
```

In the `EDIT_PERMISSIONS` object, rename the field `paymentStatus` to `feeLineStatus`. Both old and new use the same role list (`['MANAGING_DIRECTOR', 'FINANCE']`). Update any consumer of `canEdit('paymentStatus', …)` to `canEdit('feeLineStatus', …)` (grep first; should be the PaymentsTab written in Task 15 if any).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. (PaymentsTab from Task 15 now imports `FEE_LINE_STATUS_OPTIONS` successfully.)

- [ ] **Step 3: Commit (covers Tasks 15 + 16)**

```bash
git add lib/studentDetail.ts lib/statusOptions.ts app/\(dashboard\)/students
git commit -m "feat(finance): render student fee ledger as line-based PaymentsTab"
```

---

## Task 16b: FeeLine override dialog + row action

**Goal:** Spec Flow C - Finance opens student detail → Payments tab → clicks ⋯ on an open fee row → fills in amount/currency/dueDate/reason → save.

**Files:**
- Create: `app/(dashboard)/students/[id]/_components/FeeLineOverrideDialog.tsx`
- Modify: `app/(dashboard)/students/[id]/_components/PaymentsTab.tsx` (add `⋯` button when role is FINANCE/MD on non-PAID lines)

- [ ] **Step 1: Create the dialog**

Write [app/(dashboard)/students/[id]/_components/FeeLineOverrideDialog.tsx](../../app/(dashboard)/students/[id]/_components/FeeLineOverrideDialog.tsx):

```tsx
'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FeeLine, Currency, ActionResult } from '@/types';
import { overrideFeeLine } from '@/lib/actions/feeLineActions';

const CURRENCIES: Currency[] = ['TZS', 'USD', 'GBP', 'EUR'];

interface Props {
  studentId: string;
  line: FeeLine;
  onClose: () => void;
}

export function FeeLineOverrideDialog({ studentId, line, onClose }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => overrideFeeLine(_prev, formData),
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.message);
      onClose();
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, onClose, router]);

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override fee line - {line.label}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3 pt-2">
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="lineId" value={line.id} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" defaultValue={line.amount} min={1} />
              {state?.errors?.amount && <p className="text-red-500 text-xs">{state.errors.amount[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" name="currency" defaultValue={line.currency}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" name="dueDate" type="date" defaultValue={line.dueDate.slice(0, 10)} />
            {state?.errors?.dueDate && <p className="text-red-500 text-xs">{state.errors.dueDate[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea id="reason" name="reason" placeholder="e.g. 10% scholarship - academic merit" />
            {state?.errors?.reason && <p className="text-red-500 text-xs">{state.errors.reason[0]}</p>}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Apply override'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Add the "⋯" trigger inside `FeeLineRow` (PaymentsTab)**

Edit [app/(dashboard)/students/[id]/_components/PaymentsTab.tsx](../../app/(dashboard)/students/[id]/_components/PaymentsTab.tsx) from Task 15.

At the top of the file, add imports:

```tsx
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { FeeLineOverrideDialog } from './FeeLineOverrideDialog';
```

In `FeeLineRow`, add local state and a trigger button. Replace the existing bottom row (the one with `<p>{pct}% paid</p>` and `<StatusSelect ... />`) with:

```tsx
      {open && (
        <FeeLineOverrideDialog
          studentId={studentId}
          line={line}
          onClose={() => setOpen(false)}
        />
      )}
      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-[11px] text-gray-500 font-medium">{pct}% paid</p>
        <div className="flex items-center gap-2">
          <StatusSelect
            value={line.status}
            options={FEE_LINE_STATUS_OPTIONS}
            editable={canEdit}
            action={async next => updateFeeLineStatus(studentId, line.id, next)}
            size="sm"
          />
          {canEdit && line.status !== 'PAID' && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-7 h-7 rounded-md hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900"
              aria-label="Override fee line"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
```

And add `const [open, setOpen] = useState(false);` at the top of the `FeeLineRow` function body.

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/students/\[id\]/_components/FeeLineOverrideDialog.tsx app/\(dashboard\)/students/\[id\]/_components/PaymentsTab.tsx
git commit -m "feat(finance): add FeeLine override dialog for Finance role"
```

---

## Task 17: Rewrite payments/page.tsx, PaymentsTable, [id]/page.tsx

**Goal:** The `/payments` route now shows individual `FeeLine` rows (with student name, fee type, currency) instead of one-row-per-student aggregates.

**Files:**
- Modify: `app/(dashboard)/payments/page.tsx`
- Modify: `app/(dashboard)/payments/_components/PaymentsTable.tsx`
- Modify: `app/(dashboard)/payments/[id]/page.tsx`

- [ ] **Step 1: Rewrite `payments/page.tsx`**

Replace the file at [app/(dashboard)/payments/page.tsx](../../app/(dashboard)/payments/page.tsx):

```tsx
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { PaymentsTable, FeeLineRow } from './_components/PaymentsTable';
import { mockFeeLedgers } from '@/lib/mock/mockFeeLedgers';
import { mockStudents } from '@/lib/mock/mockStudents';
import { sumInCurrency } from '@/lib/finance/fxRates';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { RecordPaymentButton } from './_components/RecordPaymentButton';
import { formatCurrency } from '@/lib/format';
import { Currency } from '@/types';

export default async function PaymentsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');

  const session = JSON.parse(sessionCookie.value);
  const allowedRoles = ['FINANCE', 'MANAGING_DIRECTOR'];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');

  // Flatten ledgers to one row per FeeLine for the table
  const rows: FeeLineRow[] = [];
  for (const ledger of mockFeeLedgers) {
    const student = mockStudents.find(s => s.id === ledger.studentId);
    if (!student) continue;
    for (const line of ledger.lines) {
      rows.push({
        id: line.id,
        studentId: ledger.studentId,
        studentName: student.fullName,
        type: line.type,
        label: line.label,
        amount: line.amount,
        paidAmount: line.paidAmount,
        currency: line.currency,
        dueDate: line.dueDate,
        status: line.status,
        overridden: !!line.overrideReason,
      });
    }
  }

  const display: Currency = 'TZS';
  const totalCollected = sumInCurrency(rows.map(r => ({ amount: r.paidAmount, currency: r.currency })), display);
  const outstanding = sumInCurrency(
    rows.filter(r => r.status !== 'PAID' && r.status !== 'WAIVED')
       .map(r => ({ amount: r.amount - r.paidAmount, currency: r.currency })),
    display,
  );
  const overdueCount = rows.filter(r => r.status === 'OVERDUE').length;
  const pendingCount = rows.filter(r => r.status === 'UNPAID' || r.status === 'PARTIAL').length;
  const clearedCount = rows.filter(r => r.status === 'PAID').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Payments"
        description="Per-fee ledger across all students. Phase 1: tracking only - Phase 2 adds receiving."
        actions={['FINANCE', 'MANAGING_DIRECTOR'].includes(session.role) && <RecordPaymentButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label={`Collected (${display})`} value={formatCurrency(totalCollected, { compact: true, currency: display })} icon={DollarSign} />
        <KPICard label={`Outstanding (${display})`} value={formatCurrency(outstanding, { compact: true, currency: display })} icon={Clock} />
        <KPICard label="Overdue lines" value={overdueCount} icon={AlertCircle} trendDirection="down" />
        <KPICard label="Cleared lines" value={clearedCount} icon={CheckCircle2} />
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <PaymentsTable data={rows} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite PaymentsTable**

Replace [app/(dashboard)/payments/_components/PaymentsTable.tsx](../../app/(dashboard)/payments/_components/PaymentsTable.tsx):

```tsx
'use client';

import { Currency, FeeType, FeeLineStatus } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';

export interface FeeLineRow {
  id: string;
  studentId: string;
  studentName: string;
  type: FeeType;
  label: string;
  amount: number;
  paidAmount: number;
  currency: Currency;
  dueDate: string;
  status: FeeLineStatus;
  overridden: boolean;
}

interface Props {
  data: FeeLineRow[];
}

const STATUS_PILL: Record<FeeLineStatus, string> = {
  UNPAID:  'bg-gray-100 text-gray-700',
  PARTIAL: 'bg-amber-50 text-amber-700',
  PAID:    'bg-green-50 text-green-700 font-bold',
  OVERDUE: 'bg-red-50 text-red-700',
  WAIVED:  'bg-gray-100 text-gray-500 line-through',
};

export function PaymentsTable({ data }: Props) {
  const columns: ColumnDef<FeeLineRow>[] = [
    {
      accessorKey: 'dueDate',
      header: 'Due',
      cell: ({ row }) => <span className="text-gray-700 text-xs">{formatDate(row.original.dueDate)}</span>,
    },
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <Link href={`/students/${row.original.studentId}`} className="font-medium text-gray-900 hover:text-primary">
          {row.original.studentName}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Fee',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-900">{row.original.type}</span>
          <span className="text-[11px] text-gray-500">{row.original.label}</span>
        </div>
      ),
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid / Total',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="text-gray-900">{formatCurrency(row.original.paidAmount, { currency: row.original.currency })}</span>
          <span className="text-gray-400"> / {formatCurrency(row.original.amount, { currency: row.original.currency })}</span>
        </div>
      ),
    },
    {
      accessorKey: 'currency',
      header: 'Cur',
      cell: ({ row }) => <span className="text-[11px] text-gray-600">{row.original.currency}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_PILL[row.original.status]}`}>
          {row.original.status}
          {row.original.overridden && <span className="ml-1">·adj</span>}
        </span>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} searchKey="studentName" />;
}
```

- [ ] **Step 3: Rewrite `[id]/page.tsx`**

Replace [app/(dashboard)/payments/[id]/page.tsx](../../app/(dashboard)/payments/[id]/page.tsx):

```tsx
import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { mockFeeLedgers } from '@/lib/mock/mockFeeLedgers';
import { mockStudents } from '@/lib/mock/mockStudents';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function FeeLedgerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const { id } = await params;
  // id may be a studentId (legacy URL shape) or a FeeLine id
  const ledger =
    mockFeeLedgers.find(l => l.studentId === id) ??
    mockFeeLedgers.find(l => l.lines.some(line => line.id === id));

  if (!ledger) notFound();
  const student = mockStudents.find(s => s.id === ledger.studentId);

  return (
    <GenericDetailPage
      title={`Fee Ledger: ${student?.fullName ?? ledger.studentId}`}
      data={ledger}
      backPath="/payments"
      backLabel="Payments"
    />
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: exits 0 (PaymentsTab, payments/page, payments/[id] are all clean now).

There may still be errors from `RecordPaymentForm` (uses old `recordPayment` action) and `genericActions.ts` (mentions `payments` collection) - those are next.

---

## Task 18: RecordPaymentForm type-only update + validations/payment.ts

**Goal:** Keep the existing record-payment UX compiling against the new model. Full Phase 2 rewrite is out of scope here.

**Files:**
- Modify: `lib/validations/payment.ts`
- Modify: `app/(dashboard)/payments/_components/RecordPaymentForm.tsx`
- Modify: `lib/actions/paymentActions.ts` (temporary patch - file is deleted in the final cleanup)

- [ ] **Step 1: Update validation schema**

Replace [lib/validations/payment.ts](../../lib/validations/payment.ts):

```ts
import { z } from 'zod';
import { FEE_TYPE } from './catalog';

export const paymentSchema = z.object({
  studentId: z.string().min(2, "Select a student to record against"),
  feeType: FEE_TYPE,
  amount: z.coerce.number().min(1000, "Minimum payment amount is 1,000"),
  receiptNumber: z.string().min(3, "Receipt number is required"),
  paymentDate: z.string().min(10, "Date is required"),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
```

- [ ] **Step 2: Patch paymentActions.ts to compile against the new model**

Replace [lib/actions/paymentActions.ts](../../lib/actions/paymentActions.ts) with a Phase-1-minimum implementation that allocates a payment onto the first matching unpaid FeeLine. Full UX rewrite is Phase 2:

```ts
'use server';

import { paymentSchema } from '../validations/payment';
import { mockFeeLedgers, getFeeLedgerForStudent } from '../mock/mockFeeLedgers';
import { mockStudents } from '../mock/mockStudents';
import { mockLeads } from '../mock/mockLeads';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';

export async function recordPayment(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors };
  }
  const { studentId, feeType, amount, paymentDate, notes } = parsed.data;
  const ledger = getFeeLedgerForStudent(studentId);
  if (!ledger) return { success: false, message: 'No fee ledger found for this student.' };

  const candidates = ledger.lines.filter(l => l.type === feeType && l.status !== 'PAID' && l.status !== 'WAIVED');
  if (candidates.length === 0) return { success: false, message: `No open ${feeType} line on this ledger.` };

  const line = candidates[0];
  line.paidAmount = Math.min(line.amount, line.paidAmount + amount);
  line.status = line.paidAmount >= line.amount ? 'PAID' : 'PARTIAL';
  ledger.updatedAt = new Date(paymentDate).toISOString();
  void notes; // notes are dropped in Phase 1; receipts UX in Phase 2

  // Update pipeline stage if appropriate
  const student = mockStudents.find(s => s.id === studentId);
  if (student && ['LEAD', 'COUNSELING', 'PAYMENT_PENDING'].includes(student.pipelineStage)) {
    student.pipelineStage = 'PAYMENT_CONFIRMED';
    student.updatedAt = new Date().toISOString();
    const lead = mockLeads.find(l => l.convertedStudentId === studentId);
    if (lead && lead.status !== 'CONVERTED') {
      lead.status = 'CONVERTED';
      lead.updatedAt = new Date().toISOString();
    }
  }

  revalidatePath('/payments');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/leads');
  return { success: true, message: 'Payment applied to first matching open fee line.' };
}

// Re-export the new fee-line status action so existing imports keep working
export { updateFeeLineStatus as updatePaymentStatus } from './feeLineActions';
```

- [ ] **Step 3: Update RecordPaymentForm fee-type options**

Edit [app/(dashboard)/payments/_components/RecordPaymentForm.tsx](../../app/(dashboard)/payments/_components/RecordPaymentForm.tsx). Replace the `<option>` list inside the `feeType` `<Select>` with:

```tsx
<option value="APPLICATION">Application</option>
<option value="TUITION">Tuition</option>
<option value="HOSTEL">Hostel</option>
<option value="AGENCY">Agency</option>
<option value="DEPOSIT">Deposit</option>
<option value="INSURANCE">Insurance</option>
<option value="VISA">Visa</option>
<option value="AIRPORT_PICKUP">Airport Pickup</option>
<option value="OTHER">Other</option>
```

Also change the `Label` for amount from `"Amount (TSh) *"` to `"Amount *"` (currency is now per-line).

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: any remaining errors are from `genericActions.ts` and `finance/page.tsx`. Next two tasks fix them.

---

## Task 19: genericActions - drop payments collection

**Goal:** The legacy `genericActions.ts` exposed `payments` as a generic-editable collection with fields like `agencyFee`. Drop it - Finance edits via the catalog/override flows now.

**Files:**
- Modify: `lib/actions/genericActions.ts`

- [ ] **Step 1: Remove the `payments` references**

Edit [lib/actions/genericActions.ts](../../lib/actions/genericActions.ts):

- Remove the import line `import { mockPayments } from '../mock/mockPayments';`
- Remove `payments: mockPayments,` from the `COLLECTIONS` object
- Remove the `payments: [...]` entry from the `EDITABLE_FIELDS` object

- [ ] **Step 2: Find consumers that pass `'payments'` as collection name**

Run: `grep -rn "genericEditRecord\|genericDeleteRecord" app/ components/ | grep -i payment`
Expected: probably no hits (PaymentsTable doesn't use the generic dropdown for editing). If there ARE hits, update them to use the fee-line override flow or remove the action.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

---

## Task 20: finance/page.tsx - receivables math

**Goal:** Finance Hub KPIs now read from `mockFeeLedgers` instead of `mockPayments`.

**Files:**
- Modify: `app/(dashboard)/finance/page.tsx`

- [ ] **Step 1: Edit imports**

In [app/(dashboard)/finance/page.tsx](../../app/(dashboard)/finance/page.tsx), replace:

```ts
import { mockPayments } from '@/lib/mock/mockPayments';
```

with:

```ts
import { mockFeeLedgers } from '@/lib/mock/mockFeeLedgers';
import { sumInCurrency } from '@/lib/finance/fxRates';
```

- [ ] **Step 2: Rewrite the `studentBalance` block**

Find the line `const studentBalance = mockPayments.reduce(...)` (line ~28). Replace it with:

```ts
const openLines = mockFeeLedgers.flatMap(l =>
  l.lines
    .filter(line => line.status !== 'PAID' && line.status !== 'WAIVED')
    .map(line => ({ amount: line.amount - line.paidAmount, currency: line.currency })),
);
const studentBalance = sumInCurrency(openLines, 'TZS');
```

- [ ] **Step 3: Rewrite the `revenueThisMonth` mockPayments branch**

Find this block:

```ts
mockPayments
  .filter(p => p.lastPaymentDate && new Date(p.lastPaymentDate) >= monthStart)
  .reduce((sum, p) => sum + p.totalPaid, 0);
```

Replace with:

```ts
sumInCurrency(
  mockFeeLedgers
    .flatMap(l => l.lines.map(line => ({
      amount: line.paidAmount,
      currency: line.currency,
      updatedAt: l.updatedAt,
    })))
    .filter(x => x.paidAmount === undefined ? false : new Date(x.updatedAt) >= monthStart)
    .map(x => ({ amount: x.amount, currency: x.currency })),
  'TZS',
);
```

- [ ] **Step 4: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 5: Commit (covers Tasks 17–20)**

```bash
git add app/\(dashboard\)/payments app/\(dashboard\)/finance/page.tsx lib/actions/paymentActions.ts lib/actions/genericActions.ts lib/validations/payment.ts
git commit -m "feat(finance): migrate payments page, table, finance hub to fee ledger model"
```

---

## Task 21: Final cleanup - delete legacy types and mocks

**Goal:** Now that all consumers point at the new model, delete the legacy `PaymentRecord` type, `mockPayments.ts`, and the `paymentActions.ts` shim (renaming `feeLineActions.ts` references where needed).

**Files:**
- Modify: `types/index.ts` (delete `PaymentRecord`, `PaymentStatus`)
- Delete: `lib/mock/mockPayments.ts`
- Delete: `lib/actions/paymentActions.ts`

**Important:** This step will break the codebase momentarily if any consumer was missed. The typecheck after this step is the final guard.

- [ ] **Step 1: Final grep for any lingering use of `PaymentRecord` or `mockPayments`**

Run: `grep -rn "PaymentRecord\|mockPayments" app/ lib/ components/ | grep -v ".next" | grep -v "docs/"`
Expected: no hits.

If there ARE hits, fix them inline (typically: change import to `StudentFeeLedger` and `mockFeeLedgers`, then adapt usage).

- [ ] **Step 2: Delete the legacy mock**

Run: `rm lib/mock/mockPayments.ts`

- [ ] **Step 3: Delete `paymentActions.ts`**

Since `feeLineActions.ts` now owns the fee-line actions, and the `RecordPaymentForm` import still points at `paymentActions.ts` (the shim), do this carefully:

Run: `grep -n "from '@/lib/actions/paymentActions'\|from '../actions/paymentActions'\|from './paymentActions'" -r app/ lib/`

For each hit, update the import to point at `@/lib/actions/feeLineActions` (or, for `recordPayment` specifically, leave it in `paymentActions.ts` for now if it's still in use - actually `recordPayment` is also defined there now after Task 18, so just keep `paymentActions.ts` for that single function).

**Resolution:** Keep `paymentActions.ts` (it only contains `recordPayment` and a re-export of `updateFeeLineStatus`). Don't delete it. Delete only `mockPayments.ts`.

- [ ] **Step 4: Remove the legacy types**

Edit [types/index.ts](../../types/index.ts):

- Delete the line `export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'CLEARED' | 'OVERDUE';`
- Delete the entire `PaymentRecord` interface block (`export interface PaymentRecord { ... }`)

- [ ] **Step 5: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all exit 0.

- [ ] **Step 6: Commit**

```bash
git add types/index.ts lib/mock/mockPayments.ts
git commit -m "refactor(finance): remove legacy PaymentRecord type and mock"
```

---

## Task 22: Manual verification walkthrough

**Goal:** Confirm every feature path works in the dev server, and no other module regressed.

**Files:** none

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Log in (any FINANCE or MANAGING_DIRECTOR user from mockUsers)**

Open `http://localhost:3000`. Log in.

- [ ] **Step 3: Catalog walkthrough**

- [ ] Navigate to `/finance/catalog`. Confirm the Catalog tab is highlighted in the sub-nav.
- [ ] Left pane shows 2 active universities. Toggle "Show archived" → see "Oxford Academy Old Partnership".
- [ ] Click "New" → fill name "Test University", country "Test Country", save → row appears in list, toast confirms.
- [ ] Click "Coventry University London" → right pane shows packages grouped by Bachelor and Masters.
- [ ] Click "New Package" → fill in name "Test Package", level Bachelor, program "Test", add a fee row with amount 1000 / GBP / on enrollment → save → package appears in list.
- [ ] Click the "Edit" button on an existing package → change tuition amount → save. Because 0 students use it (or 1), confirm dialog appears with 3 choices if studentCount > 0. Pick "new enrollments only".
- [ ] Click "Archive" on a package with students → confirm behaviour (per current spec we don't gate this with a count modal; archive succeeds silently).
- [ ] Click "Duplicate" on a package → see "(Copy)" entry appear.
- [ ] Click "View" on a package → `/finance/catalog/[id]` shows fee table and assigned students list.

- [ ] **Step 4: Marketing flow - add a student with a package**

- [ ] Go to `/students` → "Add Student".
- [ ] Fill required fields. Scroll to "Enrollment Package (optional)". Pick University → Package dropdown filters. Pick a package → fee preview shows.
- [ ] Submit. Open the new student's detail page → Payments tab → see materialised FeeLines with correct currencies and due dates.

- [ ] **Step 5: Override flow (live)**

- [ ] Open `/students/std_005`. Payments tab shows the tuition row with the "Adjusted" amber badge. Hover the badge → reason and author tooltip.
- [ ] Click the "⋯" menu on an unpaid line of any student → "Override". Dialog opens.
- [ ] Enter a new amount, leave currency/dueDate empty, type reason "Test override" → save → row updates with the new amount and the "Adjusted" badge.

- [ ] **Step 6: KPI rollups**

- [ ] `/finance` → "Receivables" KPI shows a TZS-equivalent value pulled from `mockFeeLedgers`.
- [ ] `/payments` → KPIs show collected/outstanding/overdue/cleared counts. Table shows one row per FeeLine with student name + fee type + currency.

- [ ] **Step 7: Regression check on unchanged modules**

- [ ] `/finance/petty-cash` loads.
- [ ] `/finance/invoices` loads.
- [ ] `/finance/payroll` loads.
- [ ] `/finance/expenses` loads.
- [ ] `/leads` Kanban loads.
- [ ] `/staff` loads (if accessible to your role).

- [ ] **Step 8: Stop the dev server**

Press `Ctrl+C` in the terminal.

- [ ] **Step 9: Final commit if anything was patched during walkthrough**

If you fixed any issue during the walkthrough, commit it with a descriptive message. Otherwise no commit needed.

---

## Definition of done

- All 22 tasks above have green checkboxes
- `npm run typecheck && npm run lint && npm run build` all exit 0
- Manual walkthrough completed end-to-end with no console errors
- `git log` shows clean, focused commits per task group
- `git grep "PaymentRecord\|mockPayments"` returns zero hits outside `docs/`
