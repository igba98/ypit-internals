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
