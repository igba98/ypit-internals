# Finance Phase 1 — Fee Structures & Packages

**Status:** Design approved · awaiting implementation plan
**Date:** 2026-05-26
**Owner:** Finance + Marketing (consumers); Finance + Managing Director (authors)
**Phase:** 1 of 4 — see "Roadmap context" below

---

## Roadmap context

The broader goal is to make the Finance section of the YPIT dashboard capable of
handling real office workflows: receiving student payments, issuing receipts,
managing budgets, and connecting the marketing → finance → admission → travel
handoff visible in the office's existing CSV trackers (2026 Budget interns sheet,
2026/2027 Master Enrollment sheet).

We decomposed the work into four phases. **This spec covers Phase 1 only.**

| Phase | Scope | Why this order |
|---|---|---|
| **1 — Fee Structures & Packages** (this spec) | Per-university "packages" with multi-currency fee defaults; per-student fee ledger materialized from a package | Foundation — every other phase reads from this data model |
| 2 — Receiving Payments + Receipts + Channels | Record-Payment flow, channel tracking (NMB/NBC/M-Pesa/cash), receipt issuance, statement of account | Day-to-day money work; depends on Phase 1's ledger shape |
| 3 — Master Enrollment Finance Ledger | Composite view: every student × marketing rep × admission status × travel status × fees | Composes Phases 1 + 2 + existing modules |
| 4 — Annual Budget vs. Actual | Annual budget for payroll, allowances, recurring expenses; month-by-month variance | Orthogonal to 2/3; can land any time after 1 |

Phases 2–4 will each get their own spec.

---

## Goals

1. Replace the rigid single-currency `PaymentRecord` shape with a flexible
   per-student fee ledger that supports mixed-currency fees (TZS application
   fee, USD agency fee, GBP tuition) — matching how the office actually invoices.
2. Let Finance/MD define a catalog of **Universities** and **Packages**
   (a sellable program offer) with default fee components.
3. Let Marketing/Admissions assign a package to a student during enrollment;
   the system materializes the student's fee ledger from the package.
4. Allow Finance to override individual fee lines (scholarships, sibling
   discounts) with an audit trail.
5. Keep the existing Finance Hub, Petty Cash, Invoices, Payroll, and Expenses
   modules untouched in behavior — only the Student Payments path changes.

## Non-goals (Phase 1)

- Recording actual payments against fee lines — payment recording UX comes in Phase 2.
- Receipt generation (HTML/PDF) — Phase 2.
- Bank/channel tracking on payments — Phase 2.
- Installment schedules within a single fee (a fee line has one due date) — later.
- Commission tracking for sub-agents — later.
- FX rate management UI — rates live in a config file in Phase 1.
- Statement-of-account PDF — Phase 2.
- Read-only catalog mirror page for non-Finance roles — out of scope; non-Finance
  roles see fee defaults inline in the Add Student form.

---

## User decisions captured during brainstorming

1. **Package rigidity:** Locked from package by default, with per-student
   override allowed and visible (overrideReason + overriddenBy + overriddenAt).
2. **Currency model:** Each fee component keeps its native currency. KPIs roll
   up using an FX rate config; native amounts retained for receipts and the
   per-student ledger.
3. **Fee components:** Fixed system enum (`FeeType`), extensible by code change.
   Standard set: APPLICATION, TUITION, HOSTEL, AGENCY, plus DEPOSIT, INSURANCE,
   VISA, AIRPORT_PICKUP, OTHER. Each package picks which apply.
4. **Due dates:** Per-fee due date, computed from a `dueRule` on the package's
   FeeDefault at the moment the package is assigned to a student. Concrete
   dates are then stored on the student's FeeLine.
5. **Authoring permissions:** Finance + MD create/edit Universities and
   Packages. Marketing + Admissions assign packages to students. Per-student
   fee overrides require Finance.
6. **Migration:** Replace the existing `PaymentRecord` with the new
   `StudentFeeLedger` in one PR. Migrate the 15 existing mock records 1:1. No
   parallel system.

---

## Architecture

### 1. Data model (types/index.ts)

```ts
// NEW
export interface University {
  id: string;                       // uni_coventry_london
  name: string;                     // "Coventry University London"
  country: string;                  // "United Kingdom"
  city?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  defaultReportingMonths?: string[]; // ['September', 'January']
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

// NEW — fee type enum (system-level, extensible by code)
export type FeeType =
  | 'APPLICATION' | 'TUITION' | 'HOSTEL' | 'AGENCY'
  | 'DEPOSIT' | 'INSURANCE' | 'VISA' | 'AIRPORT_PICKUP' | 'OTHER';

// NEW — currency union (start narrow, expand by code)
export type Currency = 'TZS' | 'USD' | 'GBP' | 'EUR';

// NEW — package = a sellable offer
export interface Package {
  id: string;                       // pkg_coventry_london_bachelor_business
  universityId: string;
  name: string;                     // "Bachelor — Business Management"
  studyLevel: 'FOUNDATION' | 'BACHELOR' | 'MASTERS' | 'PHD' | 'DIPLOMA';
  program: string;                  // "Business Management"
  description?: string;
  feeDefaults: FeeDefault[];
  status: 'ACTIVE' | 'ARCHIVED';
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeDefault {
  type: FeeType;
  label?: string;                   // optional override of default label
  amount: number;
  currency: Currency;
  dueRule: FeeDueRule;
  required: boolean;                // false → optional fee (e.g. AIRPORT_PICKUP)
}

export type FeeDueRule =
  | { kind: 'DAYS_FROM_ENROLLMENT'; days: number }   // app fee = 30
  | { kind: 'BEFORE_REPORTING_DATE'; days: number }  // tuition = 0 days before
  | { kind: 'ON_ENROLLMENT' }
  | { kind: 'CUSTOM' };                              // user sets per student

// REPLACES PaymentRecord
export interface StudentFeeLedger {
  studentId: string;
  packageId?: string;               // null if no package assigned yet
  currencyDisplay?: Currency;       // KPI rollup preference; default TZS
  lines: FeeLine[];
  createdAt: string;
  updatedAt: string;
}

export type FeeLineStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED';

export interface FeeLine {
  id: string;                       // fl_001
  type: FeeType;
  label: string;                    // resolved label
  amount: number;
  currency: Currency;
  dueDate: string;
  paidAmount: number;
  status: FeeLineStatus;
  overrideReason?: string;          // present iff line was overridden
  overriddenById?: string;
  overriddenByName?: string;
  overriddenAt?: string;
  sourceFeeDefaultIndex?: number;   // which feeDefaults[] entry it came from
}
```

**Removals:** `PaymentRecord` and `PaymentStatus` are deleted from
`types/index.ts`. Every importer must be updated in the same PR.

### 2. FX rates (lib/finance/fxRates.ts — new)

```ts
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
  return Math.round((amount * FX_RATES_TO_TZS[from]) / FX_RATES_TO_TZS[to]);
}
```

Single source of truth. No FX rate editor UI in Phase 1.

### 3. Routes and components

**FinanceSubNav** ([app/(dashboard)/finance/_components/FinanceSubNav.tsx](app/(dashboard)/finance/_components/FinanceSubNav.tsx)) gains one new tab between **Overview** and **Petty Cash**:

```
Overview · Catalog ⭐ · Petty Cash · Invoices · Payroll · Expenses · Student Payments ↗
```

**New routes** under `app/(dashboard)/finance/` (role-guarded by the existing layout):

```
app/(dashboard)/finance/catalog/
├── page.tsx                          # Catalog hub — split view
├── _components/
│   ├── UniversityList.tsx            # searchable, status filter, archive toggle
│   ├── UniversityForm.tsx            # sheet
│   ├── PackageList.tsx               # cards grouped by study level
│   ├── PackageForm.tsx               # sheet with FeeDefaults editor
│   ├── FeeDefaultsEditor.tsx         # repeating rows
│   └── CatalogActions.tsx            # New University, New Package, Archive/Restore
└── [packageId]/page.tsx              # Package detail + student-count + preview
```

**Existing routes that change:**

| File | Change |
|---|---|
| [app/(dashboard)/students/_components/AddStudentForm.tsx](app/(dashboard)/students/_components/AddStudentForm.tsx) | Add University + Package dropdowns; live preview of fee defaults; package field optional. |
| [app/(dashboard)/students/[id]/_components/PaymentsTab.tsx](app/(dashboard)/students/[id]/_components/PaymentsTab.tsx) | Rewrite to render `StudentFeeLedger.lines`. Per-line: type, label, amount + currency, due date, paid amount, status, override badge. |
| [app/(dashboard)/payments/page.tsx](app/(dashboard)/payments/page.tsx) | KPIs aggregate `FeeLine`s with TZS rollup. |
| [app/(dashboard)/payments/_components/PaymentsTable.tsx](app/(dashboard)/payments/_components/PaymentsTable.tsx) | Rewrite to render fee lines with student name + fee type + currency. |
| [app/(dashboard)/payments/_components/RecordPaymentForm.tsx](app/(dashboard)/payments/_components/RecordPaymentForm.tsx) | **Phase 1: type-only update** to keep the form compiling against the new model. The full record-payment UX rewrite (fee-line picker, channel, currency, receipt issuance) is Phase 2. |
| [app/(dashboard)/payments/[id]/page.tsx](app/(dashboard)/payments/[id]/page.tsx) | Rewrite to render a single student's `StudentFeeLedger` (was rendering a `PaymentRecord`). |
| [app/(dashboard)/finance/page.tsx](app/(dashboard)/finance/page.tsx) | Update receivables/Account Snapshot math to read from `StudentFeeLedger`s. |
| [lib/actions/paymentActions.ts](lib/actions/paymentActions.ts) | Rename to `feeLineActions.ts`. Replace `updatePaymentStatus` with `updateFeeLineStatus`, add `overrideFeeLine`. Phase 2 will add `recordPaymentOnLine`. |
| [lib/actions/genericActions.ts](lib/actions/genericActions.ts) | Update any `PaymentRecord`-aware branches to read `StudentFeeLedger` instead. |
| [lib/studentDetail.ts](lib/studentDetail.ts) | Aggregator currently joins `PaymentRecord`; switch to joining `StudentFeeLedger` so the student detail page renders correctly. |
| [lib/validations/payment.ts](lib/validations/payment.ts) | Replace hardcoded `["AGENCY","APPLICATION","TUITION","HOSTEL"]` enum with `FeeType` import. Schema becomes payment-allocation-aware for Phase 2 hand-off, but stays minimal in Phase 1. |
| [lib/statusOptions.ts](lib/statusOptions.ts) | Add `FEE_LINE_STATUS_OPTIONS`. Remove or repurpose `PAYMENT_STATUS_OPTIONS`. |

**New server actions** (`lib/actions/catalogActions.ts` — new file):

- `createUniversity`, `updateUniversity`, `archiveUniversity`, `restoreUniversity`
- `createPackage`, `updatePackage`, `archivePackage`, `restorePackage`, `duplicatePackage`
- `assignPackageToStudent(studentId, packageId)` — materializes FeeLines using
  the package's `feeDefaults` + each one's `dueRule`, resolved against the
  student's `targetIntake` and current date
- `reassignPackageToStudent(studentId, newPackageId)` — clears old lines (with
  confirmation), re-materializes
- `overrideFeeLine(studentId, lineId, { amount?, currency?, dueDate?, reason })`

### 4. Catalog page layout

```
┌─ Universities ──────────────┐  ┌─ Coventry University London ─────────────────────┐
│ + New University            │  │ UK · London · 3 active packages · 4 students     │
│                             │  │ + New Package                                    │
│ ● Coventry Univ. London  3  │  ├──────────────────────────────────────────────────┤
│ ● Intl College Dundee    2  │  │ Bachelor                                         │
│ ● [archived] Oxford      0  │  │  ▸ Business Management  4 students  •active     │
│                             │  │  ▸ Computer Science     2 students  •active     │
│                             │  │ Foundation                                       │
│                             │  │  ▸ Pre-Bachelor          1 student   •active    │
└─────────────────────────────┘  └──────────────────────────────────────────────────┘
```

---

## Key flows

### Flow A — Create a package
Finance opens Catalog → selects a university → "+ New Package" → fills name,
level, program → adds fee defaults (type, amount, currency, dueRule,
required) → save. `createPackage` runs server-side validation, writes audit
log entry. Existing students are not affected.

### Flow B — Enroll a student with a package
Marketing fills the Add Student form → selects University → Package dropdown
filters to that uni → live preview shows fee defaults → save. `createStudent`
+ `assignPackageToStudent` run together; the student's `StudentFeeLedger` is
created with one `FeeLine` per `FeeDefault`, due dates resolved via dueRule.

### Flow C — Override a fee for a student
Finance opens student detail → Payments tab → clicks "⋯" on a fee row →
"Override" → edits amount/currency/dueDate + types reason → save. The line is
marked with `overrideReason`, `overriddenById`, `overriddenByName`,
`overriddenAt`. Display shows "Adjusted" badge; hover reveals reason and who.

### Flow D — Archive a package
Finance archives a package. Confirmation modal lists the count of students
currently using it. Their existing FeeLines are unaffected. Add-Student form
no longer shows the package as selectable.

### Flow E — Edit a package after students exist (the subtle one)
Finance changes tuition from £12,500 → £13,000 on a package used by 4
students. Confirmation modal offers three options:

- **Apply to new enrollments only** (default — safest): package update saved;
  existing students' FeeLines untouched.
- **Apply to existing UNPAID lines too**: package update saved; FeeLines for
  the affected students with `status ∈ {UNPAID, PARTIAL}` and matching
  `sourceFeeDefaultIndex` get their `amount` updated.
- **Cancel**: discard the edit.

The choice is written to the audit log.

### Currency rollup
Each `FeeLine.amount`/`paidAmount` is native. For KPIs and rollups:

```
total = Σ (line.amount - line.paidAmount) × FX[line.currency → displayCurrency]
        across lines where status ∉ {PAID, WAIVED}
```

Native composition is shown in sublabels: "£12,500 + $500 + TZS 1.2M
outstanding · TZS 45M equivalent".

---

## Permissions

| Action | MD | FINANCE | MARKETING_MGR | MARKETING_STAFF | ADMISSIONS | TRAVEL | OPERATIONS |
|---|---|---|---|---|---|---|---|
| View catalog (Finance route) | ✅ | ✅ | — | — | — | — | — |
| Create/edit/archive University | ✅ | ✅ | — | — | — | — | — |
| Create/edit/archive Package | ✅ | ✅ | — | — | — | — | — |
| Edit package after students assigned (Flow E) | ✅ | ✅ | — | — | — | — | — |
| Assign package to student | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Reassign student's package | ✅ | ✅ | — | — | — | — | — |
| Override a FeeLine | ✅ | ✅ | — | — | — | — | — |
| Change FeeLine status manually (e.g. WAIVED) | ✅ | ✅ | — | — | — | — | — |
| View FeeLines on student detail | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 read | 👁 read |

The catalog inherits the existing Finance layout's role guard. Marketing and
Admissions see fee defaults *inline* in the Add Student form (they do not get a
catalog page in Phase 1).

---

## Validation rules

**University:**
- `name` required, 2–100 chars, unique among ACTIVE universities
- `country` required, 2–60 chars

**Package:**
- `universityId` must reference an ACTIVE university
- `name` required, unique within the same `universityId`
- `studyLevel` ∈ enum
- `feeDefaults` may be empty (shell package); if non-empty:
  - `type` ∈ `FeeType` enum
  - `amount` > 0
  - `currency` ∈ `Currency` enum
  - `dueRule.days` ≥ 0 where applicable
  - No duplicate `(type, label)` pairs

**FeeLine override:**
- `reason` required, 3–200 chars
- `amount` > 0 if provided
- `dueDate` parseable as ISO 8601

**Package assignment:**
- Student must not already have a `packageId`. Reassignment requires the
  separate `reassignPackageToStudent` action, which confirms loss of existing
  lines.

All validation is enforced server-side using zod (the project's existing
pattern). Form-level errors render inline; action-level errors return
`ActionResult` ([types/index.ts:333](types/index.ts#L333)).

---

## Error handling boundary cases

| Case | Behavior |
|---|---|
| Editing a package with assigned students | Three-way confirmation modal (Flow E) |
| Archiving a university with active packages | Confirmation modal listing them |
| Deleting a fee default that students depend on | Blocked; user must archive the package instead |
| Currency change on a package with paid lines under it | Blocked with explanation |
| FX rate missing for a currency at rollup time | KPI shows native-only sum + warning badge |
| Reassigning a package on a student with paid lines | Confirmation modal; paid lines are preserved as-is, unpaid lines are replaced |

Every catalog mutation and FeeLine override writes an `AuditLog`
([types/index.ts:295](types/index.ts#L295)) row with module
`'FINANCE_CATALOG'` or `'FEE_LEDGER'`, `previousValue` + `newValue` serialized.

---

## Migration of existing `PaymentRecord`

This is a one-PR replacement, no parallel system.

**Migration script** (write-once, output pasted into `mockFeeLedgers.ts`, then
deleted):

```ts
function migrate(old: PaymentRecord): StudentFeeLedger {
  const lines: FeeLine[] = [];
  const push = (type: FeeType, total: number, paid: number, paidDate?: string) => {
    if (total === 0) return;
    lines.push({
      id: `fl_${old.id}_${type.toLowerCase()}`,
      type,
      label: defaultLabelFor(type),
      amount: total,
      currency: old.currency as Currency,
      dueDate: deriveDueDate(type, old),
      paidAmount: paid,
      status: deriveStatus(total, paid, dueDate),
    });
  };
  push('AGENCY',      old.agencyFee,      old.agencyFeePaid,      old.agencyFeeDate);
  push('APPLICATION', old.applicationFee, old.applicationFeePaid, old.applicationFeeDate);
  push('TUITION',     old.tuitionFee,     old.tuitionFeePaid,     old.tuitionFeeDate);
  push('HOSTEL',      old.hostelFee,      old.hostelFeePaid,      old.hostelFeeDate);

  return {
    studentId: old.studentId,
    packageId: undefined,             // legacy: no package linked
    currencyDisplay: 'TZS',
    lines,
    createdAt: oldEarliestDate(old),
    updatedAt: old.lastPaymentDate ?? new Date().toISOString(),
  };
}
```

**Back-fill rules for legacy `dueDate`:**
- AGENCY: `student.createdAt + 30 days`
- APPLICATION: `student.createdAt + 30 days`
- TUITION & HOSTEL: parse from `student.targetIntake` or fall back to `student.createdAt + 90 days`

**Files deleted in this PR:**
- [lib/mock/mockPayments.ts](lib/mock/mockPayments.ts)

**Files added in this PR:**
- [lib/mock/mockUniversities.ts](lib/mock/mockUniversities.ts)
- [lib/mock/mockPackages.ts](lib/mock/mockPackages.ts)
- [lib/mock/mockFeeLedgers.ts](lib/mock/mockFeeLedgers.ts)
- [lib/finance/fxRates.ts](lib/finance/fxRates.ts)
- [lib/actions/catalogActions.ts](lib/actions/catalogActions.ts)
- All files under [app/(dashboard)/finance/catalog/](app/(dashboard)/finance/catalog/)

**Files renamed in this PR:**
- [lib/actions/paymentActions.ts](lib/actions/paymentActions.ts) → `lib/actions/feeLineActions.ts`

**Touch-point grep done during spec writing** (2026-05-26):

```
lib/studentDetail.ts
lib/statusOptions.ts
lib/mock/mockPayments.ts
lib/actions/genericActions.ts
lib/actions/paymentActions.ts
lib/validations/payment.ts
app/(dashboard)/payments/_components/PaymentsTable.tsx
app/(dashboard)/payments/page.tsx
app/(dashboard)/payments/[id]/page.tsx
app/(dashboard)/students/[id]/_components/PaymentsTab.tsx
app/(dashboard)/finance/page.tsx
```

All are covered above. The plan-writing step should re-run the same grep to
catch any new references that landed between spec-time and plan-time.

---

## Mock data plan

**Universities** (at least three to exercise the active/archived states):
- `uni_coventry_london` — Coventry University London, UK, London, ACTIVE
- `uni_intl_college_dundee` — International College Dundee, UK, Dundee, ACTIVE
- `uni_oxford` — Oxford, UK, ARCHIVED (no packages)

**Packages** (six to cover the variety in the CSV):

| Package | Uni | Level | Fee defaults (sketch) |
|---|---|---|---|
| Bachelor — Business Management | Coventry London | BACHELOR | TUITION £12,500 GBP · APPLICATION $500 USD · AGENCY TZS 1,200,000 · HOSTEL £6,000 GBP optional |
| Bachelor — Computer Science | Coventry London | BACHELOR | similar mix |
| Masters — MBA | Coventry London | MASTERS | TUITION £15,000 GBP · APPLICATION $500 USD · AGENCY TZS 1,500,000 |
| Foundation — Pharmacology | Intl College Dundee | FOUNDATION | TUITION £8,500 GBP · APPLICATION $500 USD · AGENCY TZS 1,000,000 · DEPOSIT £500 GBP |
| Foundation — Mechanical Engineering | Intl College Dundee | FOUNDATION | similar |
| Foundation — Computer Engineering | Intl College Dundee | FOUNDATION | similar |

**Fee ledgers:**
- 15 ledgers migrated 1:1 from existing `mockPayments.ts` (TZS-only legacy lines, no `packageId`)
- ~3 fresh ledgers linked to new packages:
  - One fully UNPAID (newest enrollment)
  - One PARTIAL with mixed currencies
  - One with an OVERRIDE (scholarship reason recorded)

Together this seeds every state the UI can render.

---

## Verification

Per the project's verification-before-completion practice:

1. `pnpm tsc --noEmit` (or project equivalent) — zero errors
2. `pnpm lint` — zero new warnings/errors
3. `pnpm build` — passes
4. **Manual browser walkthrough** on `pnpm dev`:
   - [ ] Catalog page loads; lists 2 active + 1 archived university
   - [ ] Create new university; appears in list
   - [ ] Click university; see packages grouped by study level
   - [ ] Create new package with mixed-currency fee defaults
   - [ ] Edit existing package amount; three-way modal appears (Flow E)
   - [ ] Archive package; confirmation lists student count
   - [ ] Add new student via Marketing form; package dropdown filters by uni; preview shows
   - [ ] Save student; PaymentsTab shows FeeLines with correct due dates
   - [ ] Override a FeeLine; row shows "Adjusted" badge + hover reason
   - [ ] `/finance` Receivables KPI shows TZS-equivalent rollup
   - [ ] `/payments` shows FeeLines (not aggregate students); filterable by status/currency/type
5. **No regression** in Petty Cash, Invoices, Payroll, Expenses pages.

**Explicitly not verified in Phase 1:** receipt issuance, bank reconciliation,
statement-of-account PDF, payment recording UX.

---

## Open questions for implementation plan

These are intentionally deferred to the plan stage so they can be discovered
with code open:

- Exact zod schema shape for nested `feeDefaults` and discriminated union `dueRule`
- Whether the catalog uses a split-view client component or a parallel-route shell
- Whether the `RecordPaymentForm` Phase 1 minimum gets a full rewrite or a thin adapter

These do not change the architecture; they're details for the writing-plans stage.
