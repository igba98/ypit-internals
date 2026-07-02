# Client Changes Batch 2 — Design

Date: 2026-06-18 · Status: approved by Edward (chat) · Scope: ypit-frontend + ypit-backend

Client asks: Relation Officer (RO) oversight; Business Development module (events +
university partnerships); MOU documentation (Finance + CEO); IT asset & password
management (IT + CEO); erase trial data (keep KANANI SOZA); contacts/email editing
restricted to IT & CEO.

Decisions taken with the user:
- RO = existing **OPERATIONS** role, upgraded (no new enum value).
- Password records = **encrypted company-credentials vault** (never staff login passwords).
- Business Dev access: view MD + MARKETING_MANAGER + MARKETING_STAFF; write MD + MARKETING_MANAGER.
- Data cleanup: **dry-run script first**, then apply against production with the user.

## A. Relation Officer (OPERATIONS upgrade) — frontend only
1. Sidebar: add OPERATIONS to the Travel and Applications nav items (pages already permit).
2. New page `/pipeline-health` (roles: OPERATIONS, MANAGING_DIRECTOR, MARKETING_MANAGER):
   - Fetch `GET /students?limit=500`; compute `daysInStage = now − stageEnteredAt` (fallback `createdAt`).
   - Default view = active pipeline (excludes TRAVELLED + MONITORING); stage filter tabs include all.
   - Bands: red > 14 days, amber 7–14, gray < 7. Sorted oldest-first.
   - KPIs: in pipeline, stuck (>14d), average days in stage, longest waiting.
   - No backend change (list already returns `stageEnteredAt`).
3. Subagent management: OPERATIONS already has read/write — no change.

## B. Business Development — `/business-development`
Backend `src/business-dev`, one migration `add_business_dev`:
- `BdEvent`: name, type enum (SCHOOL_VISIT, EXPO, SEMINAR, OPEN_DAY, WEBINAR, OTHER),
  venue?, eventDate, endDate?, budget Int? (TZS), status enum (PLANNED, ONGOING, COMPLETED,
  CANCELLED), description?, outcomes?, leadsGenerated Int @default(0), createdBy*, soft delete.
  Routes: GET/POST/PATCH/DELETE `/business-dev/events` (read: MD+MM+MS; write: MM, MD via bypass).
- `UniversityPartnership` (1:1 University, mirrors SubAgentContract): status enum (PROSPECT,
  IN_DISCUSSION, MOU_SIGNED, ACTIVE, DORMANT, ENDED), commissionTerms?, notes?, lastContactAt?,
  updatedBy*. Child `PartnershipFollowUp` (notes, createdBy*, createdAt).
  Routes: GET `/business-dev/partnerships` (universities + partnership + mouCount),
  PUT `/business-dev/partnerships/:universityId` (upsert), POST `.../follow-ups`.
Frontend: page with `?tab=events|partnerships`; events table + slide-in form; partnerships
table with status chips + edit/follow-up slide-in. Sidebar “Business Dev” (Briefcase).

## C. MOU Documentation — `/mous` (Finance + CEO)
Backend `src/mous`, migration `add_mous`:
- `Mou`: title, universityId? (FK SetNull) + partnerName (denormalized), description?,
  signedDate?, effectiveDate?, expiryDate?, status enum (DRAFT, ACTIVE, EXPIRED, TERMINATED),
  file fields (storageKey @unique?, originalName?, mimeType?, sizeBytes?), uploadedBy*,
  createdBy*, soft delete.
- Files: reuse global `R2StorageService` presigned flow (key `mous/{id}/{rand}-{name}`,
  25 MB, PDF/Word/images). Routes: CRUD + `POST /mous/:id/upload-url`,
  `POST /mous/:id/finalize`, `GET /mous/:id/download-url`. All `@Roles(FINANCE)` —
  Finance + CEO exactly (MD bypasses guards).
Frontend: list + KPIs (total/active/expiring ≤60d/expired), create/edit slide-in with
university picker (`GET /finance/universities`), XHR PUT upload with progress, download.
Sidebar: add to FINANCE focused menu + MD list.

## D. IT — Password Vault + staff email editing
Backend `src/vault`, migration `add_company_credentials`:
- `CompanyCredential`: service, category enum (EMAIL, HOSTING, DOMAIN, SAAS, WIFI,
  SOCIAL_MEDIA, OTHER), username, secretCiphertext (AES-256-GCM, key = env
  `VAULT_ENCRYPTION_KEY`, format iv:tag:ct base64), url?, notes?, createdBy*/updatedBy*.
- Routes `@Roles(IT_ADMIN)` (IT + CEO): GET list (no secrets), POST, PATCH, DELETE,
  POST `/:id/reveal` → decrypts once, **audit-logs every reveal**.
- Missing key ⇒ clear 400 “Vault not configured”. Generate a key into backend `.env`;
  user must set it in production env too.
- Staff email edit: `UpdateStaffDto` + service accept `email` (uniqueness check,
  ConflictException on dupe, audit prev→new). Endpoint already IT-only ⇒ IT + CEO.
Frontend: `/it-vault` page (IT_ADMIN + MD): table, reveal modal w/ copy + auto-hide,
add/edit slide-in, delete confirm. Sidebar “Password Vault” (KeyRound).
EditStaffForm gains an email field with a “this changes their login” warning.

## E. Trial-data cleanup (production)
`ypit-backend/scripts/cleanup-trial-data.mjs` + npm script:
- Default **dry-run**: lists students to delete (all except keep-list, default
  “KANANI SOZA”, case-insensitive) with linked-record counts (payments, applications,
  travel, documents + R2 keys, transitions, guardians, monitoring, follow-ups, ledgers,
  invoices), and separately lists leads/enquiries/tasks/campaign data.
- `--apply` executes; `--include-leads --include-enquiries --include-tasks --include-campaigns`
  widen scope. Staff users never touched. R2 objects of deleted documents removed after commit.
- Run against prod by pointing `DATABASE_URL` at Railway, together with the user.

## Cross-cutting
- Equipment tracking: already complete (IT + CEO) — no work.
- Conventions: Zod DTOs (`createZodDto`), `@Roles` guard (MD bypasses), `AuditService.log`
  on all mutations, denormalized `*Name` columns, soft delete where listed.
- Role gating updated in all three frontend places: Sidebar roles, page `allowedRoles`.
- Build order: A → D → C → B → E. Typecheck + eslint clean on both apps; e2e smoke with
  local backend before done.
