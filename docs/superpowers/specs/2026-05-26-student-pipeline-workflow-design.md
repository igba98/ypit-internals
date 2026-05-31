# Student Pipeline Workflow - Design Spec

**Date:** 2026-05-26
**Status:** Approved (brainstorming phase)
**Author:** Brainstormed with Claude
**Next step:** Implementation plan via `writing-plans` skill

---

## 1. Problem

The student record has a 9-stage pipeline (`LEAD → COUNSELING → PAYMENT_PENDING → PAYMENT_CONFIRMED → APPLICATION_SUBMITTED → UNIVERSITY_ACCEPTED → TRAVEL_PLANNING → TRAVELLED → MONITORING`), but no workflow is enforced around it. The current `updateStudentStage` action ([lib/actions/studentActions.ts:48](lib/actions/studentActions.ts#L48)) lets anyone move a student to any stage with no validation, no captured data, no handoff to a new owner, and no notifications.

We need:
- **Owner-based handoffs** - each stage has a responsible role (Marketing, Finance, Admissions, Travel, Operations); when a stage advances, the student appears in the next owner's queue.
- **Explicit triggers with gating data** - every transition is an explicit action that requires specific fields (counseling notes, receipt number, offer letter URL, etc.) before it can fire.
- **Notifications to student + parent(s)** - every transition sends a simulated WhatsApp message to the student and the relevant guardians, plus an in-app notification to the new owner.
- **Travel sub-pipeline** - within `TRAVEL_PLANNING`, four sub-steps (Passport / Visa / Flight / Arrival) each have their own gated triggers and notifications. `TRAVEL_PLANNING → TRAVELLED` is gated on all four completing.

## 2. Goals & Non-Goals

**Goals**
- A single, centralized transition table that defines every valid stage move (source, target, allowed roles, required fields, notifications).
- A single `advanceStudent` server action that consults the table.
- A reusable `<AdvanceStageButton>` + `<AdvanceStageModal>` UI that dynamically renders the right form per transition.
- A role-based "My Queue" inbox so each owner sees students waiting on them.
- Guardian/parent contact data on every student to support parent notifications.
- A stage timeline + sent-messages panel on each student profile.
- MD override (`MANAGING_DIRECTOR` can advance any stage; can also revert backwards with a reason).

**Non-goals**
- Real WhatsApp/Twilio integration - notifications are simulated (Notification record + toast + visible "Sent Messages" panel). A real provider can be wired in later by replacing the `sendSimulated` helper.
- Real file uploads for offer letters, receipts, tickets - accept URL strings for now.
- SLA timers / reminder bots - easy to add later by querying `stageEnteredAt`.
- Bulk advance - one student at a time.
- Backend/database - this stays a mock-data prototype.

## 3. Architecture

**Approach:** Centralized transition engine. All workflow rules live in one declarative table; a single server action consults it. UI is generic and introspects the table.

```
lib/
  pipeline/
    transitions.ts        ← main 8-transition table
    travelSteps.ts        ← 4-transition sub-table for travel
    notify.ts             ← sendSimulated() helper
    fields.ts             ← FieldSpec types + render hints
  actions/
    pipelineActions.ts    ← advanceStudent, advanceTravelStep, revertStage
    guardianActions.ts    ← guardian CRUD
  mock/
    mockGuardians.ts
    mockStageTransitions.ts

components/
  pipeline/
    AdvanceStageButton.tsx
    AdvanceStageModal.tsx
    StageTimeline.tsx
    SentMessagesPanel.tsx
    TravelChecklistCard.tsx
    MyQueue.tsx
```

## 4. Data Model

### 4.1 New: `Guardian`

```ts
export type GuardianRelation = 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'SPONSOR' | 'OTHER';

export interface Guardian {
  id: string;
  studentId: string;
  fullName: string;
  relation: GuardianRelation;
  phone: string;
  whatsapp?: string;       // defaults to phone if omitted
  email?: string;
  isPrimary: boolean;       // exactly one per student
  createdAt: string;
}
```

Stored in `lib/mock/mockGuardians.ts`. CRUD via `lib/actions/guardianActions.ts`. Edited from a new "Guardians" section on the student detail page. Helpers: `getPrimaryGuardian(studentId)`, `getAllGuardians(studentId)`.

### 4.2 `Student` additions

- `stageOwnerId?: string` - user currently responsible for this stage (set when stage advances; nullable when "Assign later" was selected).
- `stageEnteredAt: string` - ISO timestamp when the student entered the current stage; used for "days in stage" reporting and queue ordering.

### 4.3 New: `StageTransition`

```ts
export interface StageTransition {
  id: string;
  studentId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  triggeredById: string;
  triggeredByName: string;
  triggeredByRole: Role;
  capturedData: Record<string, string | number | boolean>;
  notificationsSent: string[];   // Notification IDs created by this transition
  notes?: string;                 // used for reverts; required when fromStage > toStage in pipeline order
  createdAt: string;
}
```

Separate from `AuditLog` because (a) it is the product-level source of truth for "show me this student's journey", and (b) it carries the payload captured at each transition. `AuditLog` continues to be written too for system-level audit.

Travel sub-step transitions are also recorded here, with `fromStage === toStage === 'TRAVEL_PLANNING'` and `capturedData.subStep` ∈ `passport | visa | flight | arrival`.

### 4.4 `TravelRecord` additions

```ts
travelStepStatus: {
  passport: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  visa: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  flight: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  arrival: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
};
```

Existing detail fields (`passportNumber`, `visaStatus`, `flightDate`, etc.) remain and are populated by the sub-step modals; `travelStepStatus` is the gate that controls whether `TRAVEL_PLANNING → TRAVELLED` can fire.

### 4.5 `Notification` additions

- `audience: 'STUDENT' | 'PARENT_PRIMARY' | 'ALL_PARENTS' | 'NEW_OWNER' | 'TEAM'`
- `channel: 'WHATSAPP' | 'IN_APP'`
- `messageBody: string` - the exact simulated WhatsApp text
- `recipientName?: string`, `recipientPhone?: string` - for parents/students (not in-app)
- `simulated: true` - flag so UI can render a "(simulated)" badge until real send is wired

## 5. Main Transition Table

8 forward transitions. All `MANAGING_DIRECTOR`-allowed implicitly.

| # | From → To | Allowed roles | Required fields | Notify |
|---|---|---|---|---|
| 1 | `LEAD → COUNSELING` | MARKETING_STAFF, SUB_AGENT, MARKETING_MANAGER | `counselorAssigneeId` (user ID), `counselingNotes` (optional text) | STUDENT, PARENT_PRIMARY, NEW_OWNER |
| 2 | `COUNSELING → PAYMENT_PENDING` | MARKETING_STAFF, MARKETING_MANAGER | `programConfirmed: true`, `counselingOutcome` (text), `expectedAgencyFee` (number + currency) | STUDENT, PARENT_PRIMARY, NEW_OWNER (TEAM=FINANCE) |
| 3 | `PAYMENT_PENDING → PAYMENT_CONFIRMED` | FINANCE | `amountReceived` (number + currency), `receiptNumber` (text), `paymentMethod` (existing `PaymentMethod` enum), `proofUrl` (optional URL). Side-effect: locates or creates the student's `PaymentRecord`, increments `agencyFeePaid`/`totalPaid`, appends `receiptNumber` to `receiptNumbers[]`, updates `status` derived from balance. | STUDENT, PARENT_PRIMARY, NEW_OWNER (TEAM=ADMISSIONS) |
| 4 | `PAYMENT_CONFIRMED → APPLICATION_SUBMITTED` | ADMISSIONS | `submissionDate` (date), `universityConfirmed: true`, optional `applicationId` (link to existing Application). Side-effect: if no `applicationId` provided, auto-creates an `Application{status:'SUBMITTED', submissionDate}` from the student's target university/program. | STUDENT, PARENT_PRIMARY |
| 5 | `APPLICATION_SUBMITTED → UNIVERSITY_ACCEPTED` | ADMISSIONS | `offerLetterUrl` (URL), `offerAccepted: true`, `decisionDate` (date) | STUDENT, ALL_PARENTS, NEW_OWNER (TEAM=TRAVEL). Template: *"🎓 Congratulations! Offer letter from {university} attached: {offerLetterUrl}"* |
| 6 | `UNIVERSITY_ACCEPTED → TRAVEL_PLANNING` | TRAVEL, ADMISSIONS | `travelRecordCreated: true` (auto-creates a `TravelRecord` if absent) | STUDENT, PARENT_PRIMARY, NEW_OWNER |
| 7 | `TRAVEL_PLANNING → TRAVELLED` | TRAVEL | Gated by `travelStepStatus.{passport,visa,flight,arrival} === 'DONE'`. Modal is read-only checklist confirmation - Advance disabled until all four pass. | STUDENT, ALL_PARENTS, NEW_OWNER (TEAM=OPERATIONS) |
| 8 | `TRAVELLED → MONITORING` | OPERATIONS, TRAVEL | `arrivalConfirmedDate` (date), `localContactName` (text), `localContactPhone` (text), `accommodationAddress` (text) | STUDENT, ALL_PARENTS |

**MD revert action:** `revertStage(studentId, toStage, reason)` allowed for `MANAGING_DIRECTOR` only. Writes a `StageTransition` with `fromStage > toStage` in pipeline order, requires `reason`, notifies NEW_OWNER only (no student/parent message - avoids alarming on internal reversals).

**Ownership assignment after advance:**
- If the transition captured an explicit owner (e.g., `counselorAssigneeId`), `stageOwnerId = capturedData.<field>`.
- Else if exactly one user in `newOwnerRole` exists, auto-assign them.
- Else leave `stageOwnerId = null`; student appears in role-wide queue, anyone in role can claim with a "Claim" button on the queue row.
- Always: `stageEnteredAt = now()`.

## 6. Travel Sub-Pipeline

Four sub-step transitions in `lib/pipeline/travelSteps.ts`. All triggered by `TRAVEL` (MD override).

| Sub-step | Mark IN_PROGRESS when | Required to mark DONE | Notify on DONE |
|---|---|---|---|
| **Passport** | `passportStatus = APPLYING` recorded | `passportNumber` + `passportExpiry` recorded, OR `passportStatus = HAS_PASSPORT` (auto-DONE on entry to TRAVEL_PLANNING if already on file) | STUDENT, PARENT_PRIMARY - *"Passport ready ✓"* |
| **Visa** | `visaType` confirmed + `visaStatus ∈ {DOCUMENTS_GATHERING, APPLIED}` | `visaStatus = APPROVED` + `visaApprovalDate` + `visaExpiryDate` | STUDENT, ALL_PARENTS - *"Visa approved ✓"* |
| **Flight** | Flag set in modal: "Booking in progress" | `flightDate` + `flightNumber` + `airline` + `departureCity` + `destinationCity` set; `ticketUrl` optional | STUDENT, ALL_PARENTS - *"Flight booked: {airline} {flightNumber} on {date}"* |
| **Arrival** | Auto IN_PROGRESS once Flight is DONE | `arrivalConfirmedDate` + `airportPickupArranged` (boolean) + `pickupContactName`/`pickupContactPhone` (required if pickup arranged) | STUDENT, ALL_PARENTS - *"Arrival confirmed at {destinationCity} ✓"* |

Sub-step modal opens from the `<TravelChecklistCard>` (one row per sub-step). The card displays a 0/4 → 4/4 progress indicator. When the card hits 4/4, the main `<AdvanceStageButton>` for transition #7 unlocks.

**Sub-step transition recording:** Only the `→ DONE` transition writes a `StageTransition` record and sends notifications. `NOT_STARTED → IN_PROGRESS` is a silent state mutation (just updates `travelStepStatus`). This keeps the timeline focused on meaningful milestones for student + parents, not internal progress flags. The "Update" modal can advance either state, but only DONE triggers the notify pipeline.

## 7. UI

### 7.1 `<AdvanceStageButton>`
- Props: `student`, `session`.
- Looks up transition def by `student.pipelineStage`.
- Disabled with tooltip when `session.role` isn't in `allowedRoles` (e.g., Finance sees button greyed out during COUNSELING with hover: *"Marketing must advance this student first"*).
- Click → opens `<AdvanceStageModal>`.

### 7.2 `<AdvanceStageModal>`
- Renders form dynamically from `transition.requiredFields[]` (FieldSpec types: `text`, `number`, `date`, `boolean`, `select`, `userSelect`, `paymentSelect`, `url`).
- Bottom panel: **Notification preview** - renders the resolved WhatsApp template per recipient (with phone numbers), so the user sees exactly what gets sent before confirming.
- "Assign next owner" select shows all users in `newOwnerRole`, plus "Assign later" option.
- Submit calls `advanceStudent(studentId, capturedData, assigneeId)`.

### 7.3 `<MyQueue>` widget
- Placed on dashboard and at the top of `/finance`, `/applications`, `/travel`, `/students` (Operations view).
- Lists students where the current stage's owner role = session role, OR `stageOwnerId === session.userId`.
- Sorted by `stageEnteredAt` ascending (oldest first → "students waiting longest").
- Each row: name, days-in-stage badge (yellow >7d, red >14d), inline `<AdvanceStageButton>`, "Claim" button (when unassigned), link to profile.
- Empty state: *"No students waiting on you right now."*

### 7.4 Student detail page additions
[app/(dashboard)/students/[id]/page.tsx](app/(dashboard)/students/[id]/page.tsx) gains:
- **Guardians** section - list of guardians with add/edit/delete; primary toggle.
- **Stage Timeline** - `<StageTimeline>` rendering `StageTransition[]` for the student. Each row: from→to, who, when, expandable to show captured data + notifications sent.
- **Sent Messages** - `<SentMessagesPanel>` listing `Notification` records (audience STUDENT or PARENT_*), showing recipient, channel, message body, timestamp, 🟢 *(simulated)* badge.
- Existing "Change stage" dropdown is **removed**, replaced by `<AdvanceStageButton>`.

### 7.5 Students table additions
[app/(dashboard)/students/_components/StudentsTable.tsx](app/(dashboard)/students/_components/StudentsTable.tsx):
- New "Owner" column (shows `stageOwnerId` resolved to user name, or *"Unassigned"*).
- New "Waiting on" filter (filters by stage's owner role).

### 7.6 Travel detail page additions
[app/(dashboard)/travel/[id]/page.tsx](app/(dashboard)/travel/[id]/page.tsx):
- `<TravelChecklistCard>` showing 4 sub-step rows with status pill + "Update" button → opens sub-step modal.

### 7.7 Deprecations
- Remove `updateStudentStage` ([lib/actions/studentActions.ts:48](lib/actions/studentActions.ts#L48)) - replaced by `advanceStudent` / `revertStage`.
- Remove `admitStudent` ([lib/actions/studentActions.ts:69](lib/actions/studentActions.ts#L69)) - superseded by transition #5.

## 8. Notification Simulation

`lib/pipeline/notify.ts`:

```ts
sendSimulated({
  studentId,
  audience: NotifyAudience,
  channel: 'WHATSAPP' | 'IN_APP',
  template: (ctx: TransitionCtx) => string,
  transitionContext,
}) → Notification[]
```

For each recipient resolved from `audience`:
- `STUDENT` → student's `whatsapp ?? phone`
- `PARENT_PRIMARY` → guardian where `isPrimary === true`
- `ALL_PARENTS` → every guardian for the student
- `NEW_OWNER` → in-app notification only (no WhatsApp); recipient is `stageOwnerId` after advance, or all users in `newOwnerRole` if unassigned
- `TEAM` → in-app to all users in a given role (used to alert Finance/Admissions teams of incoming work)

Each created Notification gets pushed as a `sonner` toast on the triggering user's screen: *"WhatsApp sent (simulated) to {recipient name} (+255…)"*.

**Pre-send guards (in modal):**
- If audience includes a parent and student has no guardians → yellow warning *"No parent contacts on file - only the student will be notified"*; user can proceed or cancel to add a guardian first.
- Hard-block only if `audience === ['ALL_PARENTS']` is the *only* audience (rare, currently no transition is parent-only).

## 9. Audit Trail - Two Layers

| Layer | Source of truth for | Written when |
|---|---|---|
| `StageTransition` | Product-level student journey (timeline UI) | On every advance + revert + travel sub-step |
| `AuditLog` (existing, [types/index.ts:295](types/index.ts#L295)) | System-level audit (audit logs page) | Same, with `action: 'STAGE_CHANGE'`, `previousValue: fromStage`, `newValue: toStage` |

`advanceStudent` write order: **mutate student → write StageTransition → send notifications → write AuditLog**. Notification failures don't roll back the transition - they're logged with a "Retry send" button on the timeline row.

## 10. Edge Cases

| Case | Handling |
|---|---|
| Wrong role tries to advance | Button disabled with role-specific tooltip |
| Student has no primary guardian when parent notification fires | Yellow modal warning; proceed (student-only) or cancel to add guardian |
| MD reverts a stage | `revertStage(studentId, toStage, reason)`; `reason` required; notifies NEW_OWNER only |
| Application/Payment/Travel record missing when transition needs it | Auto-create minimal record and link the ID (e.g., `Application{status:'PREPARING'}`) |
| Offer letter / receipt / ticket file | URL string only for now; real upload UI is out of scope |
| Two users advance same student simultaneously | Last write wins (acceptable for mock data); defensive `lastTransitionId` check in action |
| "Assign later" selected | `stageOwnerId = null`; student in role-wide queue; "Claim" button on queue row |
| Travel sub-step: student arrives with passport already on file (`HAS_PASSPORT`) | Passport sub-step auto-DONE on entry to `TRAVEL_PLANNING`; first notification skipped |

## 11. Role → Stage Ownership (reference)

| Stage | Owner role |
|---|---|
| `LEAD` | MARKETING_STAFF / SUB_AGENT |
| `COUNSELING` | MARKETING_STAFF / MARKETING_MANAGER |
| `PAYMENT_PENDING` | FINANCE |
| `PAYMENT_CONFIRMED` | ADMISSIONS |
| `APPLICATION_SUBMITTED` | ADMISSIONS |
| `UNIVERSITY_ACCEPTED` | TRAVEL |
| `TRAVEL_PLANNING` | TRAVEL |
| `TRAVELLED` | OPERATIONS |
| `MONITORING` | OPERATIONS |

## 12. Out of Scope (Deferred)

- Real WhatsApp send (Meta Cloud API / Twilio) - replace `sendSimulated` later
- Real file upload for documents - URL strings for now
- SLA timers / overdue reminders
- Bulk advance (multi-student)
- Editing/deleting `StageTransition` records (append-only by design)
- Per-stage custom message templates editable by admins (templates are code constants for now)