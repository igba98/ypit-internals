# System Updates 2.0 (client document, Sept 2026) — design

Source: `documents/System updates 2.0.pdf` (Swahili). Decisions confirmed with Edward on
2026-09-22: Marketing Staff → RO, Travel → RO, Operations → Administrator; each RO sees only
their own book; university commissions tracked as a per-student ledger.

## Role mapping (labels only — enum values unchanged)

| Enum | New label | Interface |
|---|---|---|
| MARKETING_STAFF | Relations Officer (RO) | RO menu: My Leads, My Students, Follow-ups, Passport & Visa, Enquiries, Communication, My Performance |
| TRAVEL | Relations Officer (Travel) | Same RO menu (+ Applications); still sees every travel record |
| OPERATIONS | Administrator | Company Assets, Company Records, IT Equipment (read-only), Monitoring |
| MARKETING_MANAGER | Marketing Manager | Supervises all ROs (RO Performance, lead distribution) |

## §1 IT: collect and distribute leads
- `POST /leads/distribute {leadIds, officerIds}` (IT, MM, MD). One officer = assign; several =
  round-robin balanced by each officer's open leads. `?unassigned=true` list filter.
- Student Leads page: distribution panel, per-row reassign, status changes, "To student" convert
  (none of these existed in the UI before — leads could only be created).

## §2 Relations Officers
- Own-book scoping (`src/common/scope.ts`): RO → leads where `assignedToId = me`, students where
  `marketingStaffId = me`; detail/update/follow-up endpoints 403 outside the book. RO assistants
  inherit their creator's book. Sub-agent scoping moved server-side too.
- **Bug fixed:** lead conversion wrote the RO into `Student.assignedAgentId` (the sub-agent field).
  Now credits RO → `marketingStaffId`, sub-agent → `assignedAgentId`. Migration `backfill_v2`
  moves existing mis-filed rows.
- Performance: `GET /reports/performance?kind=RO|SUB_AGENT&year=` → leads given, contacted,
  converted students, enrolled (≥ UNIVERSITY_ACCEPTED), travelled. ROs/agents get their own row only.
  `/leads` page = RO Performance; dashboard card for ROs and sub-agents.
- Passport & visa: ROs can edit travel/passport/visa status for their own students.
- `Guardian.occupation`, `Student.previousSchool` / `Lead.previousSchool`; Personal tab editor.
  Website applications already collected these — enquiry → student conversion now carries the
  previous school and creates father/mother guardians with occupation.

## §4 Business Development
- BD (and MM) add sub-agents (`/staff` with role SUB_AGENT, "Add Sub-agent" on /subagents).
  Each sub-agent gets an `agentCode` (AG + 5 chars; existing agents back-filled).
- Website: Agent Code field on /apply, pre-filled from `/apply?agent=CODE`, live-checked via
  `GET /public/agents/:code` (first name only). Enquiry stores `agentCode` + resolved `agentId`;
  conversion credits the sub-agent. Unknown codes are kept and flagged.
- University commissions ledger (`/commissions`, `UniversityCommission`): expected → invoiced →
  received, totals per university and currency. BD + Finance write, MM reads.
- BD may now create/edit MOUs (university contracts); delete stays Finance.

## §5 Administrator
- `CompanyAsset` register (`/assets`, tags AS-YYYY-NNNN). IT hand-outs stay in Equipment,
  which the Administrator can now read.
- `AdminDocument` records (`/records`): company documents + personnel files for employees,
  interns and field workers (with or without a system account), R2 uploads, expiry warnings.

## §6 Admissions
- `/documents` review queue across all students (verify / reject / open).

## Deployment
1. `prisma migrate deploy` — `system_updates_v2`, `backfill_v2` (plus any earlier pending ones).
2. After deploy, on production: move Fanuel Mlumba (MARKETING_STAFF, "Business Development &
   Events") to BUSINESS_DEVELOPMENT if he is the BD officer; create the four RO accounts.
3. Backoffice env (optional): `NEXT_PUBLIC_WEBSITE_URL` for agent application links
   (defaults to https://www.ypitconsultancies.com).

---

## Follow-up: client voice notes, 2026-09-24 (decisions confirmed 2026-09-27)

**1. Four Relations Officers — the Marketing account is one of them.**
`MARKETING_MANAGER` joined `RO_ROLES` (backend `src/common/scope.ts`, frontend `lib/permissions.ts`),
so it gets the RO menu and own-book scoping like Marketing Staff and Travel; label
"Relations Officer (Marketing)". Its manager-only grants were removed — business-dev, partners
(schools/companies), commissions, catalog/universities, sub-agents, monitoring, letters,
applications, payments, invoices, and lead distribution. Documents were opened to every RO instead
(they upload their own students' papers). Overseeing the ROs now sits with IT and the CEO;
`/reports/performance?kind=RO` covers all four RO roles. Sub-agent recruitment is BD-only.

**2. IT captures and hands out leads.** A "Add a lead" row on Student Leads (name, phone, interest,
Relations Officer, source) creates and assigns in one step, keeping the officer selected for a batch.
The existing distribute panel still handles the unassigned queue.

**3. Website CMS (voice note 3).** 118 slots, grouped into per-page tabs:
- **Testimonials** — six stories, each with photo, name, course, university, scholarship badge and quote.
  Data moved to `components/shared/testimonials-data.ts` (a `"use client"` module cannot hand an array
  to a server page — same trap as the programmes list).
- **Site-wide contact details** — address, short address, two phones, email, WhatsApp; read by the
  footer (server) and passed to the Navbar from the root layout.
- **Wording** — homepage About heading/paragraph and the closing call-to-action, so IT/CEO can fix
  copy and punctuation themselves. Long fields render as textareas (`multiline`).
- **Image resizing** (`lib/image-resize.ts`) — every picked image is shrunk to the slot's `maxWidth`
  and cropped to the shape that slot actually renders at (hero 16:9, tiles 4:3, country cards 3:2,
  testimonial photos square, logos uncropped). The uploader shows a preview with before/after size
  and a top/centre/bottom crop choice plus "don't crop", and only uploads on confirmation.

Note: website content changes appear on the next-but-one request after the 60s window
(stale-while-revalidate) — the first request after an edit can still show the old value.

### Relations Officer roster (client, 2026-09-27)

The four ROs are **Faraja Mlumba, Lilian Masine, Yuda Ngao, Elida Nickson**. Wisdom Mwaipape stays
on as a fifth RO (the travel desk). Fanuel Mlumba is *not* Faraja — he becomes the Business
Development officer, matching his department; he owns no leads or students, so nothing needs
reassigning.

| Account | Person | Role | Action |
|---|---|---|---|
| `marketing@` | Lilian Masine | RO (Marketing) | none — becomes an RO on deploy |
| `travel@` | Wisdom Mwaipape | RO (Travel) | none — fifth RO |
| `RO@` | Fanuel Mlumba | Business Development | re-role (plan below) |
| new | Faraja Mlumba | RO | create in Staff → Add Staff |
| new | Yuda Ngao | RO | create in Staff → Add Staff |
| new | Elida Nickson | RO | create in Staff → Add Staff |

`scripts/setup-relations-officers.mjs` audits the roster (no arguments) and applies renames /
re-roles from a plan file (`scripts/ro-roster.json`), dry-run by default. New officers are
deliberately *not* created by the script — make them in the back office so each gets the welcome
email with a temporary password. All three RO role values (MARKETING_STAFF / TRAVEL /
MARKETING_MANAGER) behave identically, so new officers get "Relations Officer (RO)".

Production already had every migration through `system_updates_v2` on 2026-09-22; the
2026-09-24 voice-note work adds no schema changes, so it is a code deploy only.

---

## Finance payment recording — client video feedback, 2026-09-27

Three complaints, all reproducible:

1. **"record not found" when editing fees.** `PaymentsService.update()` read the record with
   `getByStudent()`, which throws 404 when the student has none — and after the finance data reset
   no student had one. It now uses `getOrCreateForStudent()`, so editing bootstraps the record.
2. **Only one fee type per save.** The old form posted a single `{bucket, amount}` to
   `POST :studentId/record`. New endpoint `POST :studentId/record-many` takes
   `{ lines: [{ bucket, fee?, amount? }], receiptNumber?, paymentMethod, paymentDate?, notes? }` —
   `fee` is absolute, `amount` is added to what was already paid. A fee left unset becomes what was
   paid, so the balance never reads negative.
3. **Totals typed by hand.** `totalDue`, `totalPaid`, `balance` and `status` are computed server-side
   on every save, and the new sheet shows them live as Finance types (per-fee balance plus Total
   fees / Total paid / Amount due / resulting status).

Other decisions:
- **One cash-book receipt per payment**, not one per fee type — a line per fee type would read as the
  duplicate entries the client complained about in petty cash. Description lists the split.
- Payment method and date are now on the form (they were hard-coded to bank transfer).
- Guards: paid over an explicit fee → 400 naming the fee type and both amounts; money without a
  receipt number → 422; non-Finance → 403. Fee-only edits need no receipt.
- UI: `PaymentSheet` replaces `RecordPaymentForm`; reachable from "Record Payment" and from a
  per-row "Fees & payments" action (the row passes its record in, so no extra round-trip).

---

## Bank reconciliation rework — finance feedback, 2026-09-29

The backend was already right (the snapshot computes the book balance **up to the statement date**);
the screen was the problem.

| Spec item | What was wrong | Fix |
|---|---|---|
| Date filtering | A confusing Day/Month mode with two inputs; the period table was read-only | **From / To range** + "This month" / "Last month" presets; View re-queries |
| Fetch the period's bank entries | Period rows were fetched unfiltered and filtered in the browser | Server-side `column=bank&from&to`; cash pulled separately for the excluded box |
| Carry over prior months | Unmatched entries sat in a separate all-time list | A second query (`column=bank&reconciled=false&to=<day before From>`) merges them into the register, marked **b/f** |
| Tick off against the statement | Only one-at-a-time buttons, and not on the period table | Checkboxes on every register row, select-all, **bulk** reconcile/undo via `POST /finance/cashbook/reconcile-many`, optional statement ref stored on each line |
| Snapshot the month | The save gate compared the statement against the **all-time** bank balance, so a past month could never reach difference = 0 | Gate now uses the balance **as at the To date** (`summary?to=`), and the statement date defaults to the period end |
| Bank-only | Held, but enforced client-side | Enforced by the query |
| Internal transfers | — | Verified: a petty-cash top-up shows as **one** bank payment in the register (marked "internal transfer (bank side)"); its petty-cash leg appears only in the excluded list |

Verified with June/July/August entries plus a July petty-cash top-up: July filter returned only July
bank rows; the unmatched June receipt carried over; the cash sale stayed out; book balance at 31 July
was 739,950 against an all-time 714,950 (the old comparison), and closing July with 739,950 produced
`difference = 0`; bulk tick-off set and cleared 6-7 rows with the statement ref recorded.

---

## "Record not found" when editing a payment — the *other* edit path, 2026-09-29

The 27 Sept fix addressed the fee-edit endpoint. Finance was hitting a different button: the row
menu ("⋯ → Edit Record") on the payments table, which was wired to `lib/actions/genericActions.ts` —
a leftover **in-memory demo CRUD**. It searched `mockPayments`, so on a live record it always
answered "Record not found.", and where a demo id did match it wrote to a server-memory array that
never reached the database. `/payments/[id]` ("View details") read the same demo array.

The same trap sat on the staff, monitoring, travel, applications, leads and audit-log tables —
which is also what the "can't edit/update names at Staff" report was about.

Fixed:
- `genericActions.ts` and `GenericEditPanel.tsx` **deleted**, so nothing can silently fake a save again.
- `ActionDropdown` now takes real handlers (`viewHref`, `onEdit`, `onDelete`) and renders nothing when
  none are supplied.
- Payments row → View opens the rewritten `/payments/[studentId]` (real record: fee breakdown,
  totals, receipts, notes) and Edit opens the PaymentSheet with its totals computed for you.
- Staff row → View opens `/staff/[id]`; Edit opens the real `EditStaffPanel` (exported for reuse).
- Monitoring / travel / applications rows → View only (their detail pages are real).
- Audit log and lead card → dropdown removed; those detail pages are still demo data.

Verified: `/payments/<studentId>` renders the live record (1,350,000 fee/paid, receipt RCP-EDIT-1),
and saving more fees through the sheet updated totals to fees 5,350,000 / paid 2,350,000 /
due 3,000,000 / PARTIAL.

## Correcting mis-keyed payments + printable finance reports, 2026-09-30

Three items came in: clear/fix wrongly-entered student payments, print invoice / petty cash /
salary slip "kwa kimoja kimoja na kiujumla" (individually and in aggregate), and RO lead
assignment refusing to see newly added officers.

### 1. Correcting payments

The record endpoints only ever *add* money, so a payment typed as 1,350,000 instead of 135,000
could not be walked back — editing the fee left the paid figure standing.

`POST /finance/payments/:studentId/correct` takes **absolute** figures per fee type:

```jsonc
{ "lines": [{ "bucket": "AGENCY", "paid": 135000, "fee": 135000 }],
  "reason": "Typed 1,350,000 instead of 135,000" }
```

- `paid` and `fee` are each optional, but a line needs one of them; `paid: 0` clears the entry
  (and its payment date), `fee` is clamped up to whatever is paid so the balance can't go negative.
- Totals, balance, status and `lastPaymentDate` are recomputed, never typed.
- The **difference** is posted to the cash book as a contra entry (`RECEIPT` when money was
  under-recorded, `PAYMENT` when it was over-recorded) carrying the reason, so the bank
  reconciliation and the audit trail still reconcile. That is why `reason` is required.
- A correction that changes nothing is a 400 with that wording, not a silent no-op.

Front of house: the payment sheet gained a **Correct / clear** tab (hidden until the student has a
saved record) with a "Clear all payments" button, an amber "these figures replace what is saved"
note, a required reason, and live totals. Reachable from the payments row menu and from
`/payments/[id]`.

### 2. Printing

Everything prints through the same letterhead (`app/print/_components/Letterhead.tsx`), with
signature rules where finance signs:

| Document | Single | Aggregate |
|---|---|---|
| Invoice | `/print/invoice/[id]` (existing) | `/print/invoices?from&to` |
| Petty cash | `/print/petty-cash/[id]` (voucher) | `/print/petty-cash?from&to` |
| Salary slip | `/print/payslip/[id]` | `/print/payslip?period=September%202026` (summary + a slip per staff; `&slips=0` for the summary alone) |

Buttons: a period picker in the page header for petty cash and invoices, "Print all slips" /
"Summary only" on payroll, and per-row "Print voucher" / "Print" links.

Dates default to the local month start — `toISOString()` slips a day back in East Africa.

Verified with seeded data: payroll summary totalled 1,880,000 gross / 188,000 NSSF / 215,000 PAYE /
1,477,000 net across two staff with the individual slips behind it; petty cash report walked the
float 676,000 → 1,051,000 with a category breakdown; invoice report showed 600,000 invoiced and
outstanding. Test data removed afterwards.

### 3. RO lead assignment

"Nime add wengine wawili mmoja hajaonekana … inasema RO's hawapo active while status yao ni active":
the distribute panel asks for `/staff?limit=500`, but that endpoint capped `limit` at 100, so the
request 422'd and the officer list came back **empty** — the panel then said "No active Relations
Officers yet" while Staff showed them ACTIVE. The filter also omitted `MARKETING_MANAGER`, which is
now an RO, so one of the two new officers would have been missing even on a good response.

Fixed: staff list cap 100 → 500; recipients include every RO role; a failed officer load now shows a
red banner instead of an empty list; and the backend explains per recipient why an assignment was
refused (`"<name>: account is suspended"`, `"<name>: role X cannot receive leads"`).
