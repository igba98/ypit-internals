# Phase 1: Foundation & Critical Bugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the audit's "first 60 seconds" issues — currency chaos, broken /audit route, missing branded 404, weak /tasks empty state, Finance KPI truncation — and establish the canonical `lib/format.ts` utility CLAUDE.md mandates.

**Architecture:** Centralize all currency display in a single `lib/format.ts` with a `formatCurrency(amount, opts?)` API. Migrate the existing call sites away from the legacy `lib/utils.ts` implementation (which produces `TZS X` via `Intl.NumberFormat`) to the new one (which always prefixes `TSh`). Replace remaining hardcoded currency strings (`TZS 45M`, `TZS 100,000`, `$1.2M`). Then fix the four standalone critical bugs: sidebar `/audit` link, missing `not-found.tsx`, sub-par tasks empty state, Finance KPI value truncation at 1280px.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4 (CSS-based `@theme`), Lucide icons. No test framework — verification is `npm run lint`, `npx tsc --noEmit`, and visual check in `npm run dev`.

**Audit cross-reference:**
- Issue 1 (currency chaos) → Tasks 1–4
- Issue 2 (audit 404) → Task 5
- Issue 3 (branded 404) → Task 6
- Issue 4 (tasks empty state) → Task 7
- Issue 5 (Finance KPI truncation) → Task 4
- Issue 6 (login bypass) → Task 8 (verification only — middleware already correct)

---

## File Structure

**Files to create:**
- `lib/format.ts` — canonical currency/number formatter
- `app/not-found.tsx` — branded 404 page

**Files to modify:**
- `package.json` — add `typecheck` script
- `lib/utils.ts` — remove old `formatCurrency` (callers migrate to `lib/format.ts`)
- `components/layout/Sidebar.tsx` — fix audit-logs href
- `app/(dashboard)/tasks/_components/TaskCardGrid.tsx` — proper empty state
- `app/(dashboard)/dashboard/page.tsx` — replace hardcoded `TZS 45M`
- `app/(dashboard)/payments/page.tsx` — replace hardcoded `TZS X.XM`
- `app/(dashboard)/payments/_components/PaymentsTable.tsx` — import path
- `app/(dashboard)/payments/_components/RecordPaymentForm.tsx` — label `(TZS)` → `(TSh)`
- `app/(dashboard)/students/[id]/page.tsx` — import path + opts API
- `app/(dashboard)/students/[id]/_components/PaymentsTab.tsx` — import path + opts API
- `app/(dashboard)/finance/page.tsx` — KPI compact mode + import path
- `app/(dashboard)/finance/invoices/page.tsx` — KPI compact mode + import path
- `app/(dashboard)/finance/invoices/_components/NewInvoiceButton.tsx` — labels
- `app/(dashboard)/finance/expenses/page.tsx` — KPI compact mode + import path
- `app/(dashboard)/finance/expenses/_components/ExpenseActions.tsx` — label
- `app/(dashboard)/finance/payroll/page.tsx` — hero compact mode + import path
- `app/(dashboard)/finance/petty-cash/page.tsx` — hero compact + line 103 + import path
- `app/(dashboard)/finance/petty-cash/_components/PettyCashActions.tsx` — labels + helper text
- `app/(dashboard)/reports/_components/ReportsDashboard.tsx` — replace `$1.2M`

---

## Conventions for every task

After making changes:

```bash
npm run lint
npx tsc --noEmit
```

Both must exit 0. If they fail, fix before committing.

Use the existing import alias `@/` (maps to project root). Imports for the new util are always `import { formatCurrency } from '@/lib/format';`.

---

### Task 1: Create canonical `lib/format.ts`

**Files:**
- Create: `lib/format.ts`
- Modify: `package.json`

- [ ] **Step 1: Add `typecheck` npm script**

Open `package.json` and modify the `scripts` block so it reads:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "clean": "next clean"
  },
```

- [ ] **Step 2: Create `lib/format.ts`**

Create `lib/format.ts` with this exact content:

```typescript
export type FormatCurrencyOpts = {
  compact?: boolean;
  currency?: string;
};

/**
 * Canonical currency formatter for the YPIT app.
 * - Default: TSh prefix, comma-separated, no decimals (e.g. "TSh 1,234,567")
 * - compact: short scale with suffix (e.g. "TSh 1.2M"). KPI tiles only.
 * - currency: ISO code. "TZS" (default) → "TSh" prefix. "USD" → "USD" prefix.
 */
export function formatCurrency(amount: number, opts: FormatCurrencyOpts = {}): string {
  const { compact = false, currency = 'TZS' } = opts;
  const prefix = currency === 'USD' ? 'USD' : 'TSh';

  if (compact) {
    return `${prefix} ${compactNumber(amount)}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${prefix} ${formatted}`;
}

function compactNumber(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  let n: number;
  let suffix: string;
  if (abs >= 1_000_000_000) {
    n = abs / 1_000_000_000;
    suffix = 'B';
  } else if (abs >= 1_000_000) {
    n = abs / 1_000_000;
    suffix = 'M';
  } else if (abs >= 1_000) {
    n = abs / 1_000;
    suffix = 'K';
  } else {
    return `${sign}${abs}`;
  }
  const rounded = n.toFixed(1);
  const clean = rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
  return `${sign}${clean}${suffix}`;
}
```

- [ ] **Step 3: Verify lint + typecheck pass**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both exit 0 with no errors.

- [ ] **Step 4: Sanity-check the output in a node REPL**

Run:

```bash
node -e "const { formatCurrency } = require('./lib/format.ts'); console.log(formatCurrency(1234567));"
```

This will likely fail because Node can't import TS — that's fine, skip it. Instead, just visually re-check `lib/format.ts` against these expectations:
- `formatCurrency(1234567)` → `"TSh 1,234,567"`
- `formatCurrency(1234567, { compact: true })` → `"TSh 1.2M"`
- `formatCurrency(45000000, { compact: true })` → `"TSh 45M"` (no trailing `.0`)
- `formatCurrency(100, { compact: true })` → `"TSh 100"`
- `formatCurrency(-50000, { compact: true })` → `"TSh -50K"`
- `formatCurrency(1200000, { compact: true, currency: 'USD' })` → `"USD 1.2M"`

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts package.json
git commit -m "feat(format): add canonical formatCurrency with TSh prefix and compact mode

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Migrate `lib/utils.ts` callers to `lib/format.ts`

This task touches every file that currently does `import { formatCurrency } from '@/lib/utils'` and updates the signature where needed.

**Files:**
- Modify: `lib/utils.ts`
- Modify: `app/(dashboard)/finance/page.tsx`
- Modify: `app/(dashboard)/finance/invoices/page.tsx`
- Modify: `app/(dashboard)/finance/expenses/page.tsx`
- Modify: `app/(dashboard)/finance/payroll/page.tsx`
- Modify: `app/(dashboard)/finance/petty-cash/page.tsx`
- Modify: `app/(dashboard)/payments/_components/PaymentsTable.tsx`
- Modify: `app/(dashboard)/students/[id]/page.tsx`
- Modify: `app/(dashboard)/students/[id]/_components/PaymentsTab.tsx`

- [ ] **Step 1: Remove old `formatCurrency` from `lib/utils.ts`**

Open `lib/utils.ts`. Delete lines 10-17 (the `formatCurrency` function). The file should still contain `cn`, `formatDate`, `formatRelativeTime`, `getPipelineStageLabel`, and `truncate`.

After deletion the file should look like:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { PipelineStage, PIPELINE_STAGES } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy")
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getPipelineStageLabel(stage: PipelineStage) {
  const labels: Record<PipelineStage, string> = {
    [PIPELINE_STAGES.LEAD]: "Lead",
    [PIPELINE_STAGES.COUNSELING]: "Counseling",
    [PIPELINE_STAGES.PAYMENT_PENDING]: "Payment Pending",
    [PIPELINE_STAGES.PAYMENT_CONFIRMED]: "Payment Confirmed",
    [PIPELINE_STAGES.APPLICATION_SUBMITTED]: "Application Submitted",
    [PIPELINE_STAGES.UNIVERSITY_ACCEPTED]: "University Accepted",
    [PIPELINE_STAGES.TRAVEL_PLANNING]: "Travel Planning",
    [PIPELINE_STAGES.TRAVELLED]: "Travelled",
    [PIPELINE_STAGES.MONITORING]: "Monitoring",
  };
  return labels[stage] || stage;
}

export function truncate(str: string, len: number) {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}
```

- [ ] **Step 2: Update `app/(dashboard)/finance/page.tsx`**

In this file, line 3 currently reads:

```tsx
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
```

Change to:

```tsx
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
```

Then update every `formatCurrency(x, 'TZS')` call in this file to drop the second argument. The lines to update are 103, 104, 110, 117, 124, 125, 139, 148, 157, 182, 183, 184, 185, 186, 187, 225.

Example: line 103 `value={formatCurrency(receivablesTotal, 'TZS')}` becomes `value={formatCurrency(receivablesTotal)}`.

Use `replace_all` for the literal pattern `, 'TZS')` → `)` only if you're sure no `formatCurrency(amount, 'TZS')` calls are still needed (they all are TZS). In this file, all 16 call sites are TZS, so a single replace_all of `, 'TZS')` → `)` is safe within this file.

- [ ] **Step 3: Update `app/(dashboard)/finance/invoices/page.tsx`**

Change line 3:

```tsx
import { formatCurrency, formatDate } from '@/lib/utils';
```

to:

```tsx
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
```

Lines 36, 37, 38, 39 use `formatCurrency(x, 'TZS')` — drop the `'TZS'`. Lines 85, 95, 99 use `formatCurrency(x, inv.currency)` where `inv.currency` is a data field. Change those to `formatCurrency(x, { currency: inv.currency })`.

- [ ] **Step 4: Update `app/(dashboard)/finance/expenses/page.tsx`**

Same pattern: split the import, change `, 'TZS')` → `)`, and change `formatCurrency(e.amount, e.currency)` on line 164 to `formatCurrency(e.amount, { currency: e.currency })`.

- [ ] **Step 5: Update `app/(dashboard)/finance/payroll/page.tsx`**

Split the import; lines 65, 70, 71, 120, 160, 161, 162, 163, 164 all use `, 'TZS')` — drop it.

- [ ] **Step 6: Update `app/(dashboard)/finance/petty-cash/page.tsx`**

Split the import. Lines 97, 108, 113, 138 use `, 'TZS')` — drop it. Lines 211, 214 use `formatCurrency(tx.amount, tx.currency)` and `formatCurrency(tx.balanceAfter, tx.currency)` — change to `formatCurrency(tx.amount, { currency: tx.currency })` and `formatCurrency(tx.balanceAfter, { currency: tx.currency })`.

- [ ] **Step 7: Update `app/(dashboard)/payments/_components/PaymentsTable.tsx`**

Line 7 currently reads:

```tsx
import { formatCurrency, formatDate } from '@/lib/utils';
```

Change to:

```tsx
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
```

All `formatCurrency` calls in this file (lines 51, 52, 64, 65, 73, 78) are single-argument — no signature change needed.

- [ ] **Step 8: Update `app/(dashboard)/students/[id]/page.tsx`**

Line 10:

```tsx
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
```

becomes:

```tsx
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
```

Line 112: `formatCurrency(payment.balance, payment.currency)` becomes `formatCurrency(payment.balance, { currency: payment.currency })`.

- [ ] **Step 9: Update `app/(dashboard)/students/[id]/_components/PaymentsTab.tsx`**

Line 4:

```tsx
import { formatCurrency, formatDate } from '@/lib/utils';
```

becomes:

```tsx
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
```

Lines 53, 54, 94, 109, 113 all use `formatCurrency(x, currency)` — change to `formatCurrency(x, { currency })`.

- [ ] **Step 10: Verify lint + typecheck pass**

```bash
npm run lint
npx tsc --noEmit
```

Both must exit 0. If typecheck fails with "Cannot find module '@/lib/format'" anywhere, double-check that file was created in Task 1.

If lint fails on `import { formatCurrency } from '@/lib/utils';` anywhere, you missed a file — `grep -rn "formatCurrency.*from.*lib/utils" app components` to find it.

- [ ] **Step 11: Visual smoke test**

```bash
npm run dev
```

Visit:
- http://localhost:3000/finance — top KPIs should now show `TSh ...` (still possibly truncated; that's fixed in Task 4)
- http://localhost:3000/finance/petty-cash — voucher amounts in `TSh`
- http://localhost:3000/students/std_001 — payment tab amounts in `TSh`
- http://localhost:3000/payments — table amounts in `TSh`

Stop the dev server.

- [ ] **Step 12: Commit**

```bash
git add lib/utils.ts app components
git commit -m "refactor(format): migrate all formatCurrency callers to lib/format

Replaces TZS prefix with TSh per CLAUDE.md. Updates positional currency
arg to opts.currency where data-driven (invoices, expenses, petty cash,
payments).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Replace hardcoded currency strings

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Modify: `app/(dashboard)/payments/page.tsx`
- Modify: `app/(dashboard)/payments/_components/RecordPaymentForm.tsx`
- Modify: `app/(dashboard)/finance/petty-cash/page.tsx` (line 103 only — the rest was Task 2)
- Modify: `app/(dashboard)/finance/petty-cash/_components/PettyCashActions.tsx`
- Modify: `app/(dashboard)/finance/invoices/_components/NewInvoiceButton.tsx`
- Modify: `app/(dashboard)/finance/expenses/_components/ExpenseActions.tsx`
- Modify: `app/(dashboard)/reports/_components/ReportsDashboard.tsx`

- [ ] **Step 1: Dashboard — replace `TZS 45M`**

`app/(dashboard)/dashboard/page.tsx` line 1 currently imports:

```tsx
import { cookies } from 'next/headers';
```

Add at the top, right after the existing `import { format } from 'date-fns';` line:

```tsx
import { formatCurrency } from '@/lib/format';
```

Then change line 45 from:

```tsx
          value="TZS 45M" 
```

to:

```tsx
          value={formatCurrency(45000000, { compact: true })} 
```

This will render `TSh 45M`.

- [ ] **Step 2: Payments page — replace `TZS X.XM`**

`app/(dashboard)/payments/page.tsx`. Add to the imports (after the existing `RecordPaymentButton` import on line 8):

```tsx
import { formatCurrency } from '@/lib/format';
```

Line 46 currently:

```tsx
          value={`TZS ${(totalCollected / 1000000).toFixed(1)}M`} 
```

Change to:

```tsx
          value={formatCurrency(totalCollected, { compact: true })} 
```

- [ ] **Step 3: RecordPaymentForm label**

`app/(dashboard)/payments/_components/RecordPaymentForm.tsx` line 50:

```tsx
          <Label htmlFor="amount">Amount (TZS) *</Label>
```

Change to:

```tsx
          <Label htmlFor="amount">Amount (TSh) *</Label>
```

- [ ] **Step 4: Petty cash hero — line 103 hardcoded threshold**

`app/(dashboard)/finance/petty-cash/page.tsx` line 103 (this was deliberately left for Task 3):

```tsx
              <p className="text-xs text-white/70 mt-2">Healthy float · safe threshold TZS 100,000</p>
```

Change to (use template literal):

```tsx
              <p className="text-xs text-white/70 mt-2">Healthy float · safe threshold {formatCurrency(100000)}</p>
```

(`formatCurrency` should already be imported in this file from Task 2; if not, add it.)

- [ ] **Step 5: PettyCashActions — labels and helper text**

`app/(dashboard)/finance/petty-cash/_components/PettyCashActions.tsx`. First inspect the file to know what's at the top of imports (this task's executor must `Read` the file first to find the correct import insertion point).

Add `import { formatCurrency } from '@/lib/format';` to the imports at the top of the file.

Line 55:

```tsx
        description={`Current balance: TZS ${balance.toLocaleString()}`}
```

Change to:

```tsx
        description={`Current balance: ${formatCurrency(balance)}`}
```

Line 110:

```tsx
          <Label htmlFor="amount">Amount (TZS) *</Label>
```

Change to:

```tsx
          <Label htmlFor="amount">Amount (TSh) *</Label>
```

Line 158:

```tsx
          Replenishments increase the petty cash float. Standard top-up is between TZS 200,000 – 500,000 depending on month-end activity.
```

Change to:

```tsx
          Replenishments increase the petty cash float. Standard top-up is between TSh 200,000 – 500,000 depending on month-end activity.
```

Line 169:

```tsx
        <Label htmlFor="amount">Amount (TZS) *</Label>
```

Change to:

```tsx
        <Label htmlFor="amount">Amount (TSh) *</Label>
```

- [ ] **Step 6: NewInvoiceButton — labels**

`app/(dashboard)/finance/invoices/_components/NewInvoiceButton.tsx`:

Line 92:

```tsx
            <Label htmlFor="unitPrice">Unit Price (TZS) *</Label>
```

→

```tsx
            <Label htmlFor="unitPrice">Unit Price (TSh) *</Label>
```

Line 98:

```tsx
          <Label htmlFor="tax">Tax (TZS)</Label>
```

→

```tsx
          <Label htmlFor="tax">Tax (TSh)</Label>
```

**Do NOT change line 116** (`<input type="hidden" name="currency" value="TZS" />`) — that is the ISO currency code persisted with the invoice and must remain `TZS`.

- [ ] **Step 7: ExpenseActions — label**

`app/(dashboard)/finance/expenses/_components/ExpenseActions.tsx` line 106:

```tsx
          <Label htmlFor="amount">Amount (TZS) *</Label>
```

→

```tsx
          <Label htmlFor="amount">Amount (TSh) *</Label>
```

- [ ] **Step 8: ReportsDashboard — replace `$1.2M`**

`app/(dashboard)/reports/_components/ReportsDashboard.tsx`. Add to imports at top of file (after the existing `recharts` import on line 3):

```tsx
import { formatCurrency } from '@/lib/format';
```

Line 122:

```tsx
                <span className="font-bold text-xl text-primary">$1.2M</span>
```

Change to:

```tsx
                <span className="font-bold text-xl text-primary">{formatCurrency(1200000, { compact: true })}</span>
```

- [ ] **Step 9: Verify lint + typecheck pass**

```bash
npm run lint
npx tsc --noEmit
```

Both must exit 0.

- [ ] **Step 10: Verify no remaining `TZS ` or `$` currency literals in user-visible JSX**

Run:

```bash
grep -rn "TZS " --include="*.tsx" app components | grep -v "currency.*=.*\"TZS\"" | grep -v "currency.*=.*'TZS'"
```

Expected: returns no matches (or only matches in `value="TZS"` data-attribute contexts, which are correct).

Run:

```bash
grep -rn ">\$[0-9]" --include="*.tsx" app components
```

Expected: no matches.

- [ ] **Step 11: Visual check**

```bash
npm run dev
```

Visit:
- /dashboard — Revenue Collected shows `TSh 45M`
- /payments — Total Collected shows `TSh X.XM` (e.g. `TSh 181.6M`)
- /finance/petty-cash — float threshold copy reads "safe threshold TSh 100,000"
- /reports — Key Metrics "Revenue Collected" shows `TSh 1.2M`

Stop dev server.

- [ ] **Step 12: Commit**

```bash
git add app
git commit -m "fix(currency): replace hardcoded TZS/USD strings with formatCurrency

Removes the last hardcoded 'TZS 45M', 'TZS X.XM', 'TZS 100,000', and
'\$1.2M' literals. All input labels updated to 'TSh'. ISO currency
codes persisted in form values (e.g. invoice hidden field) untouched.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Fix Finance KPI truncation via compact mode

The audit's most visible bug: at 1280px, Finance KPI values render as `TSh 2...` because the full string (`TSh 273,585,000`) is too long for the column width and gets `truncate`'d. Switch KPI values to compact mode (`TSh 273.6M`).

Only **top-level KPI tile values** should be compact. Sublabels, row breakdowns, and table cells keep full precision.

**Files:**
- Modify: `app/(dashboard)/finance/page.tsx`
- Modify: `app/(dashboard)/finance/invoices/page.tsx`
- Modify: `app/(dashboard)/finance/expenses/page.tsx`
- Modify: `app/(dashboard)/finance/payroll/page.tsx`
- Modify: `app/(dashboard)/finance/petty-cash/page.tsx`

- [ ] **Step 1: Finance overview KPIs**

In `app/(dashboard)/finance/page.tsx`, find the four top KPI cards (lines 100-129 region, with `<KpiCard label="Receivables" ...>` etc.).

For each of the four cards, update the `value={...}` prop to use compact mode. Leave the `sublabel`, `Row`, and activity-feed amounts as full precision.

Change:

```tsx
        <KpiCard
          label="Receivables"
          value={formatCurrency(receivablesTotal)}
          sublabel={`${formatCurrency(invoicesOutstanding)} on open invoices`}
          icon={ArrowDownCircle}
          tone="success"
        />
        <KpiCard
          label="Payables"
          value={formatCurrency(payablesTotal)}
          sublabel={`${mockExpenses.filter(e => e.status !== 'PAID' && e.status !== 'REJECTED').length} expenses · ${draftPayroll.length} draft payslips`}
          icon={ArrowUpCircle}
          tone="warning"
        />
        <KpiCard
          label="Petty Cash Float"
          value={formatCurrency(pettyCashBalance)}
          sublabel={pettyCashBalance < 100000 ? 'Below safe threshold — replenish soon' : 'Healthy float'}
          icon={Wallet}
          tone={pettyCashBalance < 100000 ? 'danger' : 'primary'}
        />
        <KpiCard
          label="Net This Month"
          value={formatCurrency(revenueThisMonth - expensesThisMonth)}
          sublabel={`+${formatCurrency(revenueThisMonth)} · −${formatCurrency(expensesThisMonth)}`}
          icon={TrendingUp}
          tone="default"
        />
```

to:

```tsx
        <KpiCard
          label="Receivables"
          value={formatCurrency(receivablesTotal, { compact: true })}
          sublabel={`${formatCurrency(invoicesOutstanding)} on open invoices`}
          icon={ArrowDownCircle}
          tone="success"
        />
        <KpiCard
          label="Payables"
          value={formatCurrency(payablesTotal, { compact: true })}
          sublabel={`${mockExpenses.filter(e => e.status !== 'PAID' && e.status !== 'REJECTED').length} expenses · ${draftPayroll.length} draft payslips`}
          icon={ArrowUpCircle}
          tone="warning"
        />
        <KpiCard
          label="Petty Cash Float"
          value={formatCurrency(pettyCashBalance, { compact: true })}
          sublabel={pettyCashBalance < 100000 ? 'Below safe threshold — replenish soon' : 'Healthy float'}
          icon={Wallet}
          tone={pettyCashBalance < 100000 ? 'danger' : 'primary'}
        />
        <KpiCard
          label="Net This Month"
          value={formatCurrency(revenueThisMonth - expensesThisMonth, { compact: true })}
          sublabel={`+${formatCurrency(revenueThisMonth)} · −${formatCurrency(expensesThisMonth)}`}
          icon={TrendingUp}
          tone="default"
        />
```

- [ ] **Step 2: Invoices KPIs**

In `app/(dashboard)/finance/invoices/page.tsx`, lines 36-39 — the four `<KpiTile ... value={formatCurrency(x)}>` calls. Update each `value` to use `{ compact: true }`:

```tsx
        <KpiTile icon={FileText} label="Issued" value={formatCurrency(totalIssued, { compact: true })} sub={`${mockInvoices.length} invoices`} />
        <KpiTile icon={CheckCircle2} label="Collected" value={formatCurrency(totalPaid, { compact: true })} sub={`${mockInvoices.filter(i => i.status === 'PAID').length} paid`} tone="success" />
        <KpiTile icon={ArrowDownCircle} label="Outstanding" value={formatCurrency(outstanding, { compact: true })} sub="Pending collection" tone="warning" />
        <KpiTile icon={AlertCircle} label="Overdue" value={formatCurrency(overdueAmount, { compact: true })} sub={`${overdueCount} invoice${overdueCount === 1 ? '' : 's'}`} tone={overdueCount > 0 ? 'danger' : 'default'} />
```

Do not touch the table cells later in the file (lines 85, 95, 99) — those are full-precision per-row amounts.

- [ ] **Step 3: Expenses KPIs**

In `app/(dashboard)/finance/expenses/page.tsx` lines 79-82 — same pattern. Update the four KPI tiles to compact:

```tsx
        <KpiTile icon={Receipt} label="Spent This Month" value={formatCurrency(monthTotal, { compact: true })} sub={`${monthExpenses.length} expense${monthExpenses.length === 1 ? '' : 's'}`} />
        <KpiTile icon={CheckCircle2} label="Paid" value={formatCurrency(monthPaid, { compact: true })} sub={`${monthExpenses.filter(e => e.status === 'PAID').length} settled`} tone="success" />
        <KpiTile icon={Clock} label="Awaiting Approval" value={formatCurrency(pending, { compact: true })} sub={`${mockExpenses.filter(e => e.status === 'PENDING').length} pending`} tone="warning" />
        <KpiTile icon={AlertCircle} label="Approved · Unpaid" value={formatCurrency(approved, { compact: true })} sub="Ready to pay" tone={approved > 0 ? 'danger' : 'default'} />
```

Do not touch line 99 (per-category amount) or line 164 (table cell).

- [ ] **Step 4: Payroll hero**

In `app/(dashboard)/finance/payroll/page.tsx`, the hero panel shows two big values (`text-2xl`) at lines 65 and 70. Update those two to compact. Leave line 71 (sublabel) and table cells (lines 120, 160-164) at full precision.

Read the file to find the exact lines, then make these two changes:

```tsx
            <p className="text-2xl font-bold mt-1">{formatCurrency(currentMonthBudget)}</p>
```

→

```tsx
            <p className="text-2xl font-bold mt-1">{formatCurrency(currentMonthBudget, { compact: true })}</p>
```

and

```tsx
            <p className="text-2xl font-bold mt-1">{formatCurrency(currentPending)}</p>
```

→

```tsx
            <p className="text-2xl font-bold mt-1">{formatCurrency(currentPending, { compact: true })}</p>
```

- [ ] **Step 5: Petty cash hero**

In `app/(dashboard)/finance/petty-cash/page.tsx`, the hero panel has three big values at lines 97 (`text-4xl md:text-5xl`), 108 (`text-2xl`), 113 (`text-2xl`). Switch all three to compact:

Line 97:

```tsx
            <p className="text-4xl md:text-5xl font-bold mt-2">{formatCurrency(balance)}</p>
```

→

```tsx
            <p className="text-4xl md:text-5xl font-bold mt-2">{formatCurrency(balance, { compact: true })}</p>
```

Line 108:

```tsx
            <p className="text-2xl font-bold mt-1.5">{formatCurrency(monthExpenses)}</p>
```

→

```tsx
            <p className="text-2xl font-bold mt-1.5">{formatCurrency(monthExpenses, { compact: true })}</p>
```

Line 113:

```tsx
            <p className="text-2xl font-bold mt-1.5">{formatCurrency(monthReplenishments)}</p>
```

→

```tsx
            <p className="text-2xl font-bold mt-1.5">{formatCurrency(monthReplenishments, { compact: true })}</p>
```

Do not touch the category bars (line 138) or table cells (211, 214).

- [ ] **Step 6: Verify lint + typecheck pass**

```bash
npm run lint
npx tsc --noEmit
```

Both must exit 0.

- [ ] **Step 7: Visual verification at 1280px**

```bash
npm run dev
```

Open DevTools → device-toolbar → set viewport to 1280×800. Visit:
- /finance — all four KPI values must be fully readable (no `...` truncation). Expect something like `TSh 12.5M`, `TSh 2.4M`, `TSh 420K`, `TSh 8.1M`.
- /finance/invoices — same check on the four tiles.
- /finance/expenses — same check.
- /finance/petty-cash — hero shows e.g. `TSh 420K` instead of `TSh 420,000` (the full number wouldn't truncate, but compact is consistent across all KPIs).
- /finance/payroll — hero shows compact.

Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add app
git commit -m "fix(finance): use compact format for KPI tiles to prevent truncation

Top-level KPI values at 1280px were truncating to 'TSh 2...'. Switch
all KPI tile values across Finance, Invoices, Expenses, Payroll, and
Petty Cash to compact mode (e.g. 'TSh 273.6M'). Sublabels, breakdowns,
and table cells keep full precision.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Fix sidebar Audit Logs link

**Files:**
- Modify: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Update href**

`components/layout/Sidebar.tsx` line 64:

```tsx
      { label: 'Audit Logs', href: '/audit', icon: Shield, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
```

Change to:

```tsx
      { label: 'Audit Logs', href: '/audit-logs', icon: Shield, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
```

- [ ] **Step 2: Verify lint + typecheck**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Visual verification**

```bash
npm run dev
```

Log in as a user with the `IT_ADMIN` or `MANAGING_DIRECTOR` role (e.g. David Mwangi). Click "Audit Logs" in the sidebar. Confirm:
- URL is now `/audit-logs`
- Page renders the audit log table (not a 404)

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Sidebar.tsx
git commit -m "fix(sidebar): correct Audit Logs href from /audit to /audit-logs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Create branded `not-found.tsx`

The audit flagged `/students/YP-2026-001` and the bare `/audit` 404 as showing near-invisible white-on-white text. Next.js App Router will use `app/not-found.tsx` automatically for any unmatched route.

**Files:**
- Create: `app/not-found.tsx`

- [ ] **Step 1: Create the page**

Create `app/not-found.tsx` with:

```tsx
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-muted flex items-center justify-center mx-auto mb-6 text-primary">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-600 mb-6">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify lint + typecheck**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Visual verification**

```bash
npm run dev
```

Visit:
- http://localhost:3000/students/YP-2026-001 — should show the new branded card with crimson icon, "Page not found" headline, and "Back to Dashboard" button. NOT white-on-white text.
- http://localhost:3000/nonexistent-route-zzz — same branded page.
- http://localhost:3000/audit (without logging in) — middleware will redirect to /login; this is fine. With login, after Task 5 the sidebar link won't reach `/audit` anymore, but if someone types it directly, this 404 page will show.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/not-found.tsx
git commit -m "feat(404): add branded not-found page

Replaces Next.js default white-on-white 404 with a card-styled page
matching the design system. Includes crimson icon, headline, body
copy, and back-to-dashboard CTA.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Upgrade `/tasks` empty state

The audit reports a "blank white rectangle" on first load. The actual code (`TaskCardGrid.tsx:43-47`) does render a small gray "No tasks found." but it's just text — no icon, no headline differentiation, no CTA. Replace with the icon + headline + description + CTA pattern CLAUDE.md mandates.

**Files:**
- Modify: `app/(dashboard)/tasks/_components/TaskCardGrid.tsx`

- [ ] **Step 1: Read the file and confirm current state**

The current empty branch is:

```tsx
      {initialTasks.length === 0 && (
        <div className="col-span-full py-12 text-center text-gray-500">
          No tasks found.
        </div>
      )}
```

- [ ] **Step 2: Replace empty branch with full empty state**

Update imports at top of file (currently just `Task`, `TaskCard`, and `motion`). Add:

```tsx
import { ClipboardList } from 'lucide-react';
```

Replace the empty branch with:

```tsx
      {initialTasks.length === 0 && (
        <div className="col-span-full py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primary-muted flex items-center justify-center text-primary mb-4">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No tasks yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            You don’t have any tasks for this view. Use the “Create Task” button above to add one.
          </p>
        </div>
      )}
```

(The CTA is the existing "Create Task" button in the page header — we point at it rather than duplicate.)

- [ ] **Step 3: Remove the stale `console.log` while we're here**

CLAUDE.md prohibits committed `console.log` calls. Line 38 currently:

```tsx
            onClick={(t) => console.log('Clicked task', t.id)} 
```

Change to:

```tsx
            onClick={() => undefined}
```

(The full click-to-detail wiring is outside this task's scope; this just removes the prod-prohibited log.)

- [ ] **Step 4: Verify lint + typecheck**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 5: Visual verification**

```bash
npm run dev
```

Visit /tasks. The empty state for filters that return zero tasks (e.g. switch to "Assigned by Me" as a user with no assigned tasks) must show: crimson icon, "No tasks yet" headline, and the description. NOT a blank rectangle.

For filters with tasks, the grid should still render normally.

Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/tasks/_components/TaskCardGrid.tsx
git commit -m "feat(tasks): upgrade empty state with icon, headline, and copy

Replaces a single line of gray text with the icon + headline + body
pattern from CLAUDE.md. Removes a leftover console.log in the click
handler.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Verify login wall (no code change expected)

The audit's claim that `/login` "redirects directly to /dashboard" appears to be wrong: `middleware.ts:7-9` already redirects unauthenticated requests to `/login`. This task verifies that, and adds a regression note if it turns out the audit was right after all.

**Files:**
- Read only: `middleware.ts`, `app/(auth)/login/page.tsx`

- [ ] **Step 1: Read `middleware.ts` and confirm lines 7-9 redirect unauth'd requests**

The current contents should match:

```ts
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
```

If this is missing or commented, STOP and re-scope this task to add the redirect. Otherwise proceed.

- [ ] **Step 2: Manually verify the wall works**

```bash
npm run dev
```

In a fresh incognito window (no `ypit_session` cookie):

1. Visit http://localhost:3000/dashboard — should redirect to http://localhost:3000/login. Login form should render.
2. Visit http://localhost:3000/students — should redirect to /login.
3. Visit http://localhost:3000/ — should redirect to /login (middleware also handles `/` → `/dashboard` only when authed).

If any of those load the protected page directly, the wall is broken — STOP and re-scope this task to investigate.

If all three correctly redirect to /login, the wall is working.

- [ ] **Step 3: No commit needed**

This task is verification-only. If the wall worked, move on. Note in the executor's report that the audit's login-bypass claim was stale.

---

## Self-Review Checklist (run before handoff)

After all tasks complete:

- [ ] `grep -rn "TZS " --include="*.tsx" app components | grep -v "currency"` returns no matches in JSX text
- [ ] `grep -rn ">\$[0-9]" --include="*.tsx" app components` returns no matches
- [ ] `grep -rn "formatCurrency.*from.*lib/utils" app components` returns no matches
- [ ] `grep -rn "console.log" --include="*.tsx" --include="*.ts" app components lib` returns no matches in committed code
- [ ] `npm run lint && npx tsc --noEmit` both exit 0
- [ ] Visual: /dashboard, /payments, /finance, /finance/petty-cash, /reports all show `TSh` prefix consistently
- [ ] Visual: /finance KPIs at 1280px are fully readable (compact format)
- [ ] Visual: Sidebar "Audit Logs" navigates to /audit-logs
- [ ] Visual: /nonexistent route shows the branded 404 page
- [ ] Visual: /tasks empty state shows icon + headline + description
- [ ] Verify: login wall redirects /dashboard → /login when unauthenticated

## Out of scope (to be picked up in later phases)

- Per the audit but deferred:
  - Free-text USD references in `lib/mock/mockApplications.ts:69` and `lib/mock/mockExpenses.ts:150` — these are narrative notes, not currency renders. Recommend rewriting copy in Phase 4 (per-page polish) rather than this foundation pass.
  - The Dashboard's four placeholder strings ("Monthly Intake Chart Placeholder" etc.) — defer to a later phase that decides between real charts and loading skeletons.
  - Tailwind token rename `--color-primary` → `--color-brand-primary` per CLAUDE.md — defer to Phase 3 (design system).
