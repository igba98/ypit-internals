# Task Management Overhaul - Design

**Date:** 2026-05-26
**Module:** `/tasks` (app/(dashboard)/tasks)
**Scope:** Focused additions on top of the existing tasks module - no rebuild.

---

## 1. Problem & Goals

The `/tasks` module is the closest thing the YPIT internals app has to a daily-operations entry point, but today it has gaps that prevent it from being trusted for real day-to-day work:

- No way to create a **personal task** - the create form forces an assignee.
- No way to **attach reference materials** when assigning (the `Task` type has `attachmentUrls?: string[]` but no UI surfaces it).
- The "report" flow ends the task with a single embedded `endOfDayReport` - there is **no reviewer gate, no clarification, no rejection**, no way for the assigner to push back.
- No deliverable attachments on the report.
- The page has a blank-on-first-load empty state (per UX_AUDIT), an unlabelled status dot, and a no-op card click - the surface doesn't feel like a primary work tool.

**Goal:** make `/tasks` the trustworthy daily-operations entry point. A staff member should open it first thing in the morning and immediately see *what's mine to do today, what's waiting for my review, what's overdue*. A manager should be able to assign work with reference material, get a real submission back with deliverables, and approve / request changes / reject with a reason.

## 2. Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Scope | Focused additions on top of existing module |
| Review gate | Strict - `SUBMITTED` is a distinct status; reviewer must explicitly act |
| Reviewer | Only the assigner |
| Conversation model | Activity timeline + structured rounds (no free chat) |
| Day-to-day entry point | "My Day" strip at top of `/tasks` (no new route, no homepage tile) |
| Personal task shape | Same fields as assigned tasks (one mental model) |

## 3. Architectural Approach

Extend the existing `/tasks` module rather than create a parallel one:

- Extend the existing `TaskStatus` union with `SUBMITTED`, `CHANGES_REQUESTED`, `REJECTED`. Retire the unused `REPORTED` value.
- Replace the single `endOfDayReport` field with an append-only `activity: TaskActivityEntry[]` array. Migrate existing seed data on import.
- Reuse `AttachmentField`'s base64 data-URL pattern but build a numbered multi-file variant (`MultiAttachmentField`).
- Reuse `SlideInPanel`, `Sonner`, `mockNotifications`, the existing kanban, tabs, and `StatusBadge`.

This preserves URL filters, the kanban, the list view, and every existing assumption - the new behaviour is delivered as additions.

## 4. Information Architecture

```
/tasks?view=grid|board|list&filter=…

┌─ "My Day · {date}"  + [Quick personal task] [Create Task] ────────────────┐
│                                                                            │
│  ┌─ MyDayStrip ────────────────────────────────────────────────────────┐  │
│  │  [Needs my submission] [Awaiting my review] [Due today]              │  │
│  │  [Overdue] [Blocked]                                                 │  │
│  │  Each tile is a filter link → ?filter=<bin>                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ─ Tabs: My Tasks · Assigned by Me · Department · Personal · All ─ Views ─ │
│                                                                            │
│  <Grid | Board | List>                                                     │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Personal tab** identifies personal tasks structurally: `assignedById === assignedToIds[0]` and `assignedToIds.length === 1`. No extra flag needed.
- **MyDayStrip** tiles drive a new `filter` URL value alongside the existing four. Active tile gets crimson accent. Empty bins show "0" muted; the strip never collapses.
- **Card click** opens the new `TaskDetailPanel` (today it's a no-op).

## 5. Task Kind, State Machine, Permissions

### Task kind (derived)

A task is **personal** iff `assignedById === assignedToIds[0] && assignedToIds.length === 1`.
Otherwise it's **assigned**.

### Status union

```
TODO  IN_PROGRESS  SUBMITTED  CHANGES_REQUESTED  REJECTED  COMPLETED  BLOCKED
```

### Transitions

```
                    ┌─── BLOCKED ↔ IN_PROGRESS (anyone, anytime, reason required) ───┐
                    ▼                                                                 │
   ┌────────┐  start    ┌─────────────┐  submit     ┌───────────┐                    │
   │  TODO  │ ────────▶ │ IN_PROGRESS │ ──────────▶ │ SUBMITTED │ (assigned only)    │
   └────────┘           └─────────────┘             └─────┬─────┘                    │
                              ▲                          ▼                            │
                              │     ┌────────────────────────────────────┐           │
                              │     │ Reviewer (assigner) action:         │           │
                              │     │  Approve          → COMPLETED ✓     │           │
                              │     │  Request changes  → CHANGES_REQ ───┐│           │
                              │     │  Reject           → REJECTED ✗ end │           │
                              │     └────────────────────────────────────┘           │
                              │                                          │           │
                              └──── resubmit (new round) ────────────────┘           │
                                                                                      │
   Personal tasks: IN_PROGRESS --submit--> COMPLETED (no review) ─────────────────────┘
```

### Rules

- Personal tasks skip review entirely: `submit` goes directly to `COMPLETED`.
- Assigned tasks always pass through `SUBMITTED`. Only the assigner sees Approve / Request changes / Reject.
- `CHANGES_REQUESTED` reopens the task semantically - the assignee resubmits to create a new round. No round limit.
- `REJECTED` is terminal. The card stays in the list (greyed, filtered out of active views) for audit.
- `BLOCKED` is orthogonal: settable from `TODO` or `IN_PROGRESS`, requires a reason. Unblocking returns to `IN_PROGRESS`.

### Permissions matrix

| Action | Personal | Assignee (assigned) | Assigner | Anyone else |
|---|---|---|---|---|
| Start (TODO → IN_PROGRESS) | ✓ | ✓ | - | - |
| Submit | ✓ (→ COMPLETED) | ✓ (→ SUBMITTED) | - | - |
| Approve / Request changes / Reject | - | - | ✓ | - |
| Block / Unblock | ✓ | ✓ | ✓ | - |
| Edit task fields | ✓ | - | ✓ (until SUBMITTED) | - |

## 6. Data Model

`types/index.ts`:

```ts
export type TaskStatus =
  | 'TODO' | 'IN_PROGRESS' | 'SUBMITTED'
  | 'CHANGES_REQUESTED' | 'REJECTED'
  | 'COMPLETED' | 'BLOCKED';

export type TaskActivityType =
  | 'CREATED' | 'STARTED' | 'SUBMITTED'
  | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'
  | 'BLOCKED' | 'UNBLOCKED'
  | 'EDITED';

export interface TaskAttachment {
  url: string;          // base64 data URL (matches receiptAttachments shape)
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  uploadedById: string;
  uploadedByName: string;
}

export interface TaskActivityEntry {
  id: string;
  type: TaskActivityType;
  at: string;
  actorId: string;
  actorName: string;
  note?: string;                   // submission summary, reviewer reason, block reason
  // Submission-only fields:
  progressMade?: string;
  percentageComplete?: number;
  nextActions?: string;
  blockers?: string;
  attachments?: TaskAttachment[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToIds: string[];
  assignedToNames: string[];
  assignedById: string;
  assignedByName: string;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  referenceAttachments?: TaskAttachment[];
  activity: TaskActivityEntry[];
  isPersonal: boolean;        // cached for filter performance
  currentRound: number;       // increments on each SUBMITTED entry
}
```

The legacy `endOfDayReport` and `attachmentUrls` fields are removed. Existing mock seeds are migrated on import - see `lib/mock/mockTasks.ts` migration helper in Section 9.

## 7. Validation (`lib/validations/task.ts`)

```ts
export const taskCreateSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']),
  dueDate: z.string().min(10),
  assignedToId: z.string().optional(),     // omitted ⇒ personal
  tags: z.array(z.string()).optional(),
});

export const taskSubmitSchema = z.object({
  taskId: z.string(),
  summary: z.string().min(5),
  progressMade: z.string().min(10),
  percentageComplete: z.coerce.number().min(0).max(100),
  nextActions: z.string().optional(),
  blockers: z.string().optional(),
});

export const taskReviewSchema = z.object({
  taskId: z.string(),
  decision: z.enum(['APPROVE','REQUEST_CHANGES','REJECT']),
  note: z.string().min(1).optional(),
}).refine(
  d => d.decision === 'APPROVE' || (d.note && d.note.length >= 3),
  { message: 'Reason required for Request changes / Reject', path: ['note'] }
);

export const taskBlockSchema = z.object({
  taskId: z.string(),
  reason: z.string().min(3),
});
```

## 8. Permission Helpers (`lib/tasks/permissions.ts`)

Following the existing `lib/pipeline/permissions.ts` shape:

```ts
isPersonalTask(task): boolean
canStart(task, userId): boolean
canSubmit(task, userId): boolean
canReview(task, userId): boolean
canBlock(task, userId): boolean
canEdit(task, userId): boolean
needsMyAction(task, userId): boolean       // for "Needs my submission" tile
awaitsMyReview(task, userId): boolean      // for "Awaiting my review" tile
binFor(task, userId, now): 'needs-submit' | 'awaiting-review' | 'due-today' | 'overdue' | 'blocked' | null
```

`binFor` is the single source of truth for the `MyDayStrip` counts and the per-filter views.

## 9. Server Actions (`lib/actions/taskActions.ts`)

All return `ActionResult` and call `revalidatePath('/tasks')` on success.

```ts
addTask(prev, formData)
  ├─ parse with taskCreateSchema
  ├─ resolve assignerId from session; if assignedToId omitted or === session.userId ⇒ personal
  ├─ collect referenceAttachments[] from indexed form fields
  ├─ push CREATED activity entry
  └─ unshift to mockTasks

startTask(prev, formData)            // TODO → IN_PROGRESS, appends STARTED
blockTask(prev, formData)            // → BLOCKED, requires reason
unblockTask(prev, formData)          // BLOCKED → IN_PROGRESS

submitTaskReport(prev, formData)
  ├─ parse with taskSubmitSchema
  ├─ guard: only assignee may submit
  ├─ collect deliverable attachments[]
  ├─ append SUBMITTED activity (summary, progress, %, nextActions, blockers, attachments)
  ├─ increment currentRound
  └─ isPersonal ⇒ COMPLETED, else SUBMITTED

reviewTask(prev, formData)
  ├─ parse with taskReviewSchema
  ├─ guard: only assigner may review, only when status === SUBMITTED
  └─ APPROVE → COMPLETED | REQUEST_CHANGES → CHANGES_REQUESTED | REJECT → REJECTED

editTask(prev, formData)             // assigner-only, pre-SUBMITTED, appends EDITED with diff
```

### Notifications

| Event | Recipient | NotificationType |
|---|---|---|
| `addTask` (assigned) | assignee | `TASK_ASSIGNED` |
| `submitTaskReport` (assigned) | assigner | `REPORT_SUBMITTED` |
| `reviewTask` (any decision) | assignee | `TASK_REVIEWED` *(new value)* |
| `blockTask` | assigner | `SYSTEM_ALERT` |

`NotificationType` gains `TASK_REVIEWED`.

### Audit logs

Each action appends to `mockAuditLogs`. The `AuditLog` action union gains `TASK_SUBMITTED`, `TASK_REVIEWED`, `TASK_BLOCKED` alongside the existing `TASK_ASSIGNED`.

### File handling

Form data carries attachments as `attachment_0_Url`, `attachment_0_Filename`, `attachment_0_ContentType`, `attachment_0_Size`, then `attachment_1_…`, etc., up to **5 files per form**. Server action iterates indices until it finds an empty slot. Matches the existing single-file pattern exactly, just numbered. 3MB-per-file cap unchanged.

## 10. UI Surface

### 10.1 Page wiring (`app/(dashboard)/tasks/page.tsx`)

```tsx
<PageHeader title="My Day · {date}" actions={[<QuickPersonalTaskInput/>, <CreateTaskButton/>]} />
<MyDayStrip session={session} allTasks={mockTasks} />
<Tabs>…</Tabs>
<ViewSwitcher>…</ViewSwitcher>
{view === 'grid'  && <TaskCardGrid …/>}
{view === 'board' && <TaskKanban   …/>}
{view === 'list'  && <TaskListView …/>}
```

New `filter` values: `needs-submit | awaiting-review | due-today | overdue | blocked` in addition to the existing `my-tasks | assigned-by-me | department`. A new tab **Personal** filters by `isPersonal && assignedToIds includes session.userId`.

### 10.2 New components

- **`MyDayStrip`** - 5 KPI-style tiles, each a filter link. Counts from `permissions.binFor`. Active tile crimson, empty tiles muted. Never collapses.
- **`QuickPersonalTaskInput`** - single-line input pinned in the page header. Enter to create personal task with defaults (priority MEDIUM, dueDate today EOD, assignedTo = me). Calls `addTask`.
- **`MultiAttachmentField`** - numbered wrapper around `AttachmentField`'s logic. Up to 5 files. Same MIME whitelist, same 3MB cap, same hidden-input pattern.
- **`TaskDetailPanel`** - slide-in detail (replaces the no-op card click). Sections:
  1. Header - title, priority, status badge, due date, assignee/assigner avatars, context-aware primary action.
  2. Description + Reference materials (download chips).
  3. Activity timeline - chronological `TaskActivityEntry` feed; submission entries expand to show report fields and deliverable attachments.
  Folds the current `ReportTaskPanel` into a nested step on this panel.
- **`SubmitTaskForm`** - replaces `ReportTaskForm`, adds `MultiAttachmentField` for deliverables.
- **`ReviewTaskForm`** - visible to assigner on `SUBMITTED` tasks. Radio: Approve / Request changes / Reject. Note textarea (required for the latter two).

### 10.3 Updated components

- **`CreateTaskForm`** - assignee dropdown gains pinned "Me (personal task)" option at top; selecting it hides department and changes the submit button label. New tags input. New reference materials section using `MultiAttachmentField`.
- **`TaskCard`** - unlabelled status dot replaced by `StatusBadge`; per-card "Write Report" button replaced by single context-aware primary action driven by `permissions.ts`; paperclip + count affordance when attachments present; whole card opens `TaskDetailPanel`.
- **`StatusBadge`** (shared) - extended with `SUBMITTED` (purple), `CHANGES_REQUESTED` (amber), `REJECTED` (rose).
- **`TaskKanban`** - adds columns for `SUBMITTED`, `CHANGES_REQUESTED`, `REJECTED` (collapsed by default). Drag-to-column now triggers server actions (`startTask` / `blockTask` / etc.) with permission guards; today it only mutates local state.
- **`TaskListView`** - adds an Action column rendering the same context-aware primary action; existing search now also matches tags and assignee names.

### 10.4 Empty states (fixes UX_AUDIT finding)

Replace the current blank rectangle with:
- Per-bin empty: `"Nothing in {bin}. {coaching microcopy}."` + relevant CTA.
- "All clear" celebratory card when both `Needs my submission` and `Awaiting my review` are zero, so the strip never feels broken.

## 11. Tests

`lib/actions/taskActions.test.ts` (Vitest, follows `pipelineActions.test.ts`):

- `addTask` creates personal when assignee omitted or equals session user.
- `addTask` rejects with validation errors on missing fields.
- `addTask` stores reference attachments and appends `CREATED`.
- `submitTaskReport` blocks non-assignees; appends `SUBMITTED`; sets `COMPLETED` for personal, `SUBMITTED` for assigned; increments `currentRound`.
- `reviewTask` blocks non-assigners; blocks when status ≠ `SUBMITTED`; sets correct end state per decision; requires note on Request changes / Reject.
- `blockTask` requires reason and appends `BLOCKED`.
- Notifications and audit log entries fire on each action.

`lib/tasks/permissions.test.ts` - pure-function table tests for every helper across the new statuses, both task kinds, and both actor roles.

No React-component tests planned (matches existing project conventions - none of the other modules ship them).

## 12. Manual Verification

Before claiming done:
- `yarn test` green, `yarn typecheck` clean.
- `yarn dev`, then walk through:
  1. Personal task created → appears in **Personal** tab → submit closes directly to COMPLETED.
  2. Assigned task with reference attachments → appears in assignee's **My Tasks** with paperclip indicator.
  3. Assignee Start → Submit with deliverable → status SUBMITTED, assigner's "Awaiting my review" tile increments.
  4. Assigner Request changes with note → assignee sees CHANGES_REQUESTED → resubmit → second round in timeline.
  5. Assigner Approve → COMPLETED, both parties acknowledged.
  6. Assigner Reject → REJECTED terminal, filtered out of active views.
  7. Kanban drag TODO → IN_PROGRESS persists; drag to a column without permission is blocked.
  8. Each `MyDayStrip` filter renders its empty state when no matches.

## 13. Out of Scope

- Subtasks / checklists inside a task.
- Recurring tasks.
- @mentions or free-form comments outside of activity entries.
- Real file storage (still base64 data URLs).
- Time tracking / SLA timers.
- Bulk actions / multi-select.
- Real notifications delivery (email / push).
- Dashboard summary card (Option C from brainstorming).

## 14. Rollout

Single feature branch, stacked commits in section order:

1. Types & validation schemas.
2. Mock data migration helper + seed adjustment.
3. Permission helpers + their tests.
4. Server actions + their tests.
5. `MultiAttachmentField` + `StatusBadge` updates.
6. `CreateTaskForm` / `SubmitTaskForm` / `ReviewTaskForm`.
7. `TaskDetailPanel`.
8. `TaskCard` / `TaskKanban` / `TaskListView` updates.
9. `MyDayStrip` + `QuickPersonalTaskInput` + page wiring.
10. Empty states + manual verification pass.

### Mock data migration

`lib/mock/mockTasks.ts` exports the seeded array through a `migrateLegacyTask(task)` helper run on import. For each seed:

- Set `isPersonal = (assignedById === assignedToIds[0] && assignedToIds.length === 1)`.
- Build a synthetic `CREATED` activity entry from `createdAt`, `assignedById`, `assignedByName`.
- If the legacy `endOfDayReport` is present: append a synthetic `SUBMITTED` activity entry from its fields (`summary` ← `taskSummary`, `progressMade`, `percentageComplete`, plus `submittedAt/submittedById/submittedByName`), and set `currentRound = 1`. Otherwise `currentRound = 0`.
- Drop the legacy `endOfDayReport` and `attachmentUrls` fields.
- Leave `status` untouched (the existing enum values all remain valid except `REPORTED`, which no seed uses).

Result: the app boots with the same visible tasks, now backed by the new shape, with no manual data fixes needed.
