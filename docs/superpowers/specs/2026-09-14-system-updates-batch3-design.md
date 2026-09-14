# System Updates & Requirements (client document, Sept 2026) — design

Source: `documents/SYSTEM UPDATES.pdf`. Decisions confirmed with Edward on 2026-09-14:
manager-controlled permission matrix for interns; a dedicated `BUSINESS_DEVELOPMENT` role
with its own menu.

## 1–2. Interns / assistants (IT + Marketing)

- Assistant roles for every department except the MD (and external sub-agents):
  `IT_ASSISTANT`, `MARKETING_ASSISTANT` (Marketing Manager's), `MARKETING_STAFF_ASSISTANT`,
  `FINANCE_ASSISTANT`, `ADMISSIONS_ASSISTANT`, `TRAVEL_ASSISTANT`, `OPERATIONS_ASSISTANT`,
  `BUSINESS_DEVELOPMENT_ASSISTANT`. An assistant is offered exactly its parent role's
  modules (`ROLE_MODULES` in lib/permissions.ts) and starts at Edit on all of them
  (sensitive ones at None); the manager narrows. `User.permissions` (JSON) holds
  `{ moduleKey: VIEW | EDIT | FULL }`; modules absent from the map are inaccessible.
- Backend `RolesGuard` (src/common/guards/roles.guard.ts): for assistant roles the request
  path is mapped to a module key (`src/common/permissions.ts`), the HTTP verb to a level
  (GET→VIEW, POST/PUT/PATCH→EDIT, DELETE→FULL), and the matrix must grant it. The matrix
  can only narrow: an endpoint must also be open to the assistant's parent role
  (IT_ASSISTANT→IT_ADMIN, MARKETING_ASSISTANT→MARKETING_MANAGER).
- Every department head may create/edit/deactivate/reset only their own department's
  assistant role (`assertActorMayManage` in staff.service); the Staff page shows them just
  that roster ("My Assistants"). IT Admin + MD manage everyone. Re-adding a deactivated
  email revives the account instead of failing on the unique index.
- Frontend: `lib/permissions.ts` (module registry, `can`, `pageAllowed`, `canEdit`);
  every page gate now goes through `pageAllowed(session, moduleKey, roles)`; assistant
  sidebars are generated from the matrix; `PermissionMatrix` in the staff forms.
- Demo accounts (seed): `itassistant@`, `mktassistant@`, `business@` / `ypit2026`.

## 2.2 African-countries recruitment

- `Student.countryOfOrigin`, `Lead.countryOfOrigin` (normalised names from
  `lib/countries-africa.ts`), `BdEvent.country`. Legacy Tanzanian rows back-filled by
  migration `backfill_country_of_origin`.
- Students list: per-country chips + `?country=` filter. Report
  `GET reports/recruitment-by-country?year=` → `/print/report/recruitment`.

## 3. Business interface

- Role `BUSINESS_DEVELOPMENT` — menu: Business Dev, Subagents, Schools & Contracts,
  Universities, Company Collaborations, MOUs (read), Tasks, Reports.
- **Partners module** (`src/partners`, one model `Partner` with `kind = SCHOOL | COMPANY`):
  profile + contact person, status, dates, `PartnerContract[]` (R2 uploads, mirrors MOUs),
  `PartnerFollowUp[]`. Pages `/schools`, `/companies` share `app/(dashboard)/partners/_components`.
- **University management**: `University.scope (LOCAL|INTERNATIONAL)`, `website`,
  `programsSummary`, `scholarshipNotes`; list includes partnership status + package/MOU
  counts. Page `/universities` (+ detail composing packages, MOUs, partnership).
- **Sub-agents**: report `GET reports/subagents?year=` → `/print/report/subagents`;
  write access opened to the business role.

## 4. RO interface

- 4.1 Travel: OPERATIONS already had the Travel menu; now also sees the Travel and
  Application tabs on the student page.
- 4.2 Follow-ups: `StudentFollowUp` gains `party` (STUDENT/PARENT/UNIVERSITY/INTERNAL),
  `contactName`, `pendingAction`, `actionStatus`, `assignedToId/Name`, `completedAt`.
  `GET follow-ups/board`, `PATCH follow-ups/:id/complete`. Page `/follow-ups` (overdue
  first, filter by owner); student page form captures the chain + pending action.

## Deployment

1. `prisma migrate deploy` (4 migrations: assistant roles, system_updates_batch, backfill, assistant_roles_all_departments).
2. Re-run the seed on production only if the demo accounts are wanted; otherwise create the
   Business Development user and assistants from Staff (IT Admin / Marketing Manager).
3. No new environment variables.

## Finance data reset (done 2026-09-14 on production)

`scripts/cleanup-finance-data.mjs --apply --keep-student-money` wiped the trial finance
books (cash book 48, bank reconciliations 2, petty cash 14, expenses 7, invoices 3,
payroll 28) so Finance can enter real figures. The 56 student payment records were kept
(six carried real amounts).
