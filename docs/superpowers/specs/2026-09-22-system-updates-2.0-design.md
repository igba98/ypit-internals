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
