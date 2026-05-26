# Task Management Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/tasks` the trustworthy day-to-day operations entry point — adding personal tasks, reference & deliverable attachments, a strict review gate (Approve / Request changes / Reject), an activity timeline, and a personalised "My Day" strip on top of the existing module.

**Architecture:** Extend the existing `/tasks` module — do not rebuild. Extend `TaskStatus`, replace the single `endOfDayReport` with an append-only `activity[]` timeline, reuse `AttachmentField`'s base64 data-URL pattern as a numbered multi-file variant, reuse `SlideInPanel`/`StatusBadge`/`mockNotifications`. Migration helper rewrites existing seeds on import.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript 5.9 · Tailwind v4 · Zod 4 · React Hook Form 7 · Sonner · dnd-kit · @tanstack/react-table · Vitest 2.

**Spec:** `docs/superpowers/specs/2026-05-26-task-management-overhaul-design.md`

---

## Task 1: Types & enums

**Files:**
- Modify: `types/index.ts:46-47,56,307-322,269-286`

- [ ] **Step 1: Extend `TaskStatus`, retire `REPORTED`, add `TaskActivityType`, `NotificationType.TASK_REVIEWED`, audit-log actions**

Open `types/index.ts`.

Replace line 46:
```ts
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'REPORTED';
```
with:
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
```

Replace the `NotificationType` line (around line 56):
```ts
export type NotificationType = 'TASK_ASSIGNED' | 'REPORT_SUBMITTED' | 'STAGE_CHANGED' | 'PAYMENT_RECORDED' | 'SYSTEM_ALERT' | 'DOCUMENT_UPLOADED' | 'CHECK_IN_LOGGED';
```
with:
```ts
export type NotificationType = 'TASK_ASSIGNED' | 'REPORT_SUBMITTED' | 'TASK_REVIEWED' | 'STAGE_CHANGED' | 'PAYMENT_RECORDED' | 'SYSTEM_ALERT' | 'DOCUMENT_UPLOADED' | 'CHECK_IN_LOGGED';
```

In the `AuditLog` interface (around line 312), replace the `action:` line with:
```ts
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PASSWORD_RESET' | 'ROLE_CHANGE' | 'STAGE_CHANGE' | 'PAYMENT_RECORDED' | 'REPORT_SUBMITTED' | 'TASK_ASSIGNED' | 'TASK_SUBMITTED' | 'TASK_REVIEWED' | 'TASK_BLOCKED';
```

- [ ] **Step 2: Replace the `EndOfDayReport` interface and `Task` interface**

Replace the entire `EndOfDayReport` interface (currently lines 256-267) with:
```ts
export interface TaskAttachment {
  url: string;
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
  note?: string;
  progressMade?: string;
  percentageComplete?: number;
  nextActions?: string;
  blockers?: string;
  attachments?: TaskAttachment[];
}
```

Replace the entire `Task` interface (currently lines 269-286) with:
```ts
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
  isPersonal: boolean;
  currentRound: number;
}
```

- [ ] **Step 3: Typecheck (will surface every caller that needs updating in later tasks)**

```bash
yarn typecheck 2>&1 | tee /tmp/typecheck.log | head -60
```
Expected: errors in `lib/mock/mockTasks.ts`, `lib/actions/taskActions.ts`, `components/shared/TaskCard.tsx`, `app/(dashboard)/tasks/_components/*`. These get fixed by later tasks — don't fix them here.

- [ ] **Step 4: Commit**

```bash
git add types/index.ts
git commit -m "feat(tasks): extend task type system for review workflow

Add SUBMITTED/CHANGES_REQUESTED/REJECTED statuses, TaskActivityType,
TaskAttachment, TaskActivityEntry. Replace endOfDayReport with
activity[]. Add TASK_REVIEWED notification + TASK_SUBMITTED/
TASK_REVIEWED/TASK_BLOCKED audit actions."
```

---

## Task 2: Validation schemas

**Files:**
- Modify: `lib/validations/task.ts`

- [ ] **Step 1: Replace the validation file**

Open `lib/validations/task.ts`. Replace entire contents with:

```ts
import { z } from 'zod';

export const taskCreateSchema = z.object({
  title: z.string().min(5, 'Task title must be at least 5 characters'),
  description: z.string().min(10, 'Please provide a more detailed description'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().min(10, 'Due date is required'),
  assignedToId: z.string().optional(),
  tags: z.string().optional(),
});

export const taskSubmitSchema = z.object({
  taskId: z.string().min(1),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  progressMade: z.string().min(10, 'Describe what was accomplished'),
  percentageComplete: z.coerce.number().min(0).max(100),
  nextActions: z.string().optional(),
  blockers: z.string().optional(),
});

export const taskReviewSchema = z
  .object({
    taskId: z.string().min(1),
    decision: z.enum(['APPROVE', 'REQUEST_CHANGES', 'REJECT']),
    note: z.string().optional(),
  })
  .refine(
    (d) => d.decision === 'APPROVE' || (d.note != null && d.note.trim().length >= 3),
    { message: 'Reason required for Request changes / Reject', path: ['note'] }
  );

export const taskBlockSchema = z.object({
  taskId: z.string().min(1),
  reason: z.string().min(3, 'Block reason must be at least 3 characters'),
});

export const taskUnblockSchema = z.object({
  taskId: z.string().min(1),
});

export const taskStartSchema = z.object({
  taskId: z.string().min(1),
});

export const taskEditSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(5).optional(),
  description: z.string().min(10).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
});

export type TaskCreateValues = z.infer<typeof taskCreateSchema>;
export type TaskSubmitValues = z.infer<typeof taskSubmitSchema>;
export type TaskReviewValues = z.infer<typeof taskReviewSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add lib/validations/task.ts
git commit -m "feat(tasks): zod schemas for create/submit/review/block/edit"
```

---

## Task 3: Migrate mock task seeds to the new shape

**Files:**
- Modify: `lib/mock/mockTasks.ts`

- [ ] **Step 1: Replace the entire file**

Open `lib/mock/mockTasks.ts`. Replace entire contents with:

```ts
import { Task, TaskActivityEntry } from '@/types';

interface LegacyEndOfDayReport {
  taskSummary: string;
  progressMade: string;
  blockers?: string;
  tomorrowPlan: string;
  percentageComplete: number;
  submittedAt: string;
  submittedById: string;
  submittedByName: string;
}

interface LegacyTaskSeed {
  id: string;
  title: string;
  description: string;
  assignedToIds: string[];
  assignedToNames: string[];
  assignedById: string;
  assignedByName: string;
  department: string;
  priority: Task['priority'];
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  endOfDayReport?: LegacyEndOfDayReport;
}

const legacySeeds: LegacyTaskSeed[] = [
  {
    id: 'tsk_005',
    title: 'Review Q1 Financial Audits',
    description: 'Personal oversight check on all Q1 agency and application fee aggregations. Follow up with Finance department on outstanding balances.',
    assignedToIds: ['usr_001'],
    assignedToNames: ['David Mwangi'],
    assignedById: 'usr_001',
    assignedByName: 'David Mwangi',
    department: 'Executive',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: '2026-03-30T00:00:00Z',
    createdAt: '2026-03-22T00:00:00Z',
    updatedAt: '2026-03-22T00:00:00Z',
    tags: ['MD', 'Audit'],
  },
  {
    id: 'tsk_006',
    title: 'Verify Student Intake Requirements',
    description: 'Check the master application grid against pending conditional offers for the September UK intake. Advise unqualified candidates.',
    assignedToIds: ['usr_005'],
    assignedToNames: ['Peter Njoroge'],
    assignedById: 'usr_001',
    assignedByName: 'David Mwangi',
    department: 'Admissions',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: '2026-03-26T00:00:00Z',
    createdAt: '2026-03-21T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z',
    tags: ['Admissions', 'Verification'],
  },
  {
    id: 'tsk_007',
    title: 'Process Escalated Operations Check-ins',
    description: 'Contact the Escalated student studying at MIT. Record comprehensive wellbeing check and provide psychological support resources alongside university staff.',
    assignedToIds: ['usr_007'],
    assignedToNames: ['Ibrahim Hassan'],
    assignedById: 'usr_001',
    assignedByName: 'David Mwangi',
    department: 'Operations',
    priority: 'URGENT',
    status: 'TODO',
    dueDate: '2026-03-24T00:00:00Z',
    createdAt: '2026-03-22T00:00:00Z',
    updatedAt: '2026-03-22T00:00:00Z',
    tags: ['Escalation', 'Support'],
  },
  {
    id: 'tsk_008',
    title: 'Distribute Commission Documents',
    description: "Distribute and file the standard sub-agent commission reports natively from last month's conversion pipelines. Contact partners for sign-offs.",
    assignedToIds: ['usr_009'],
    assignedToNames: ['Kevin Dube'],
    assignedById: 'usr_002',
    assignedByName: 'Sarah Kimani',
    department: 'Marketing',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '2026-03-28T00:00:00Z',
    createdAt: '2026-03-22T00:00:00Z',
    updatedAt: '2026-03-22T00:00:00Z',
    tags: ['Sub-Agent', 'Commission'],
  },
  {
    id: 'tsk_001',
    title: 'Follow up with pending visa applications for UK intake',
    description: "Contact all students who have applied for UK visas but haven't received a decision yet. Ensure they have all necessary documentation ready for potential interviews.",
    assignedToIds: ['usr_006'],
    assignedToNames: ['Grace Auma'],
    assignedById: 'usr_001',
    assignedByName: 'David Mwangi',
    department: 'Travel',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2026-03-25T00:00:00Z',
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z',
    tags: ['UK', 'Visa', 'Follow-up'],
  },
  {
    id: 'tsk_002',
    title: 'Prepare monthly financial report',
    description: 'Compile all agency fees, application fees, and tuition payments received this month. Reconcile with bank statements and prepare the summary for the MD.',
    assignedToIds: ['usr_004'],
    assignedToNames: ['Amina Saleh'],
    assignedById: 'usr_001',
    assignedByName: 'David Mwangi',
    department: 'Finance',
    priority: 'URGENT',
    status: 'TODO',
    dueDate: '2026-03-28T00:00:00Z',
    createdAt: '2026-03-22T00:00:00Z',
    updatedAt: '2026-03-22T00:00:00Z',
    tags: ['Finance', 'Report', 'Monthly'],
  },
  {
    id: 'tsk_003',
    title: 'Update marketing materials for Malaysia universities',
    description: "The new brochures for Taylor's University and APU need to be updated with the latest fee structures and intake dates. Coordinate with the design team.",
    assignedToIds: ['usr_002', 'usr_008'],
    assignedToNames: ['Sarah Kimani', 'Linda Owusu'],
    assignedById: 'usr_002',
    assignedByName: 'Sarah Kimani',
    department: 'Marketing',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    dueDate: '2026-03-15T00:00:00Z',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
    tags: ['Malaysia', 'Marketing', 'Brochure'],
    endOfDayReport: {
      taskSummary: "Updated all brochures with new fee structures.",
      progressMade: "Completed Taylor's and APU brochures. Sent to print.",
      tomorrowPlan: "Start working on Australian university materials.",
      percentageComplete: 100,
      submittedAt: "2026-03-14T17:30:00Z",
      submittedById: "usr_008",
      submittedByName: "Linda Owusu",
    },
  },
  {
    id: 'tsk_004',
    title: 'Resolve IT issue with student portal login',
    description: 'Several students reported being unable to log into the portal to check their application status. Investigate the authentication service logs.',
    assignedToIds: ['usr_003'],
    assignedToNames: ['James Osei'],
    assignedById: 'usr_001',
    assignedByName: 'David Mwangi',
    department: 'IT',
    priority: 'URGENT',
    status: 'BLOCKED',
    dueDate: '2026-03-23T00:00:00Z',
    createdAt: '2026-03-22T08:00:00Z',
    updatedAt: '2026-03-22T10:00:00Z',
    tags: ['IT', 'Bug', 'Portal'],
  },
];

function migrateLegacyTask(seed: LegacyTaskSeed): Task {
  const isPersonal =
    seed.assignedToIds.length === 1 && seed.assignedToIds[0] === seed.assignedById;

  const createdEntry: TaskActivityEntry = {
    id: `act_${seed.id}_created`,
    type: 'CREATED',
    at: seed.createdAt,
    actorId: seed.assignedById,
    actorName: seed.assignedByName,
  };

  const activity: TaskActivityEntry[] = [createdEntry];
  let currentRound = 0;

  if (seed.endOfDayReport) {
    activity.push({
      id: `act_${seed.id}_submitted_1`,
      type: 'SUBMITTED',
      at: seed.endOfDayReport.submittedAt,
      actorId: seed.endOfDayReport.submittedById,
      actorName: seed.endOfDayReport.submittedByName,
      note: seed.endOfDayReport.taskSummary,
      progressMade: seed.endOfDayReport.progressMade,
      percentageComplete: seed.endOfDayReport.percentageComplete,
      nextActions: seed.endOfDayReport.tomorrowPlan,
      blockers: seed.endOfDayReport.blockers,
    });
    currentRound = 1;
  }

  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    assignedToIds: seed.assignedToIds,
    assignedToNames: seed.assignedToNames,
    assignedById: seed.assignedById,
    assignedByName: seed.assignedByName,
    department: seed.department,
    priority: seed.priority,
    status: seed.status,
    dueDate: seed.dueDate,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
    tags: seed.tags,
    activity,
    isPersonal,
    currentRound,
  };
}

export const mockTasks: Task[] = legacySeeds.map(migrateLegacyTask);

export function getTasksByAssignee(userId: string): Task[] {
  return mockTasks.filter((t) => t.assignedToIds.includes(userId));
}

export function getTasksByDepartment(dept: string): Task[] {
  return mockTasks.filter((t) => t.department === dept);
}

export function getTasksByAssigner(userId: string): Task[] {
  return mockTasks.filter((t) => t.assignedById === userId);
}

export function getPendingReportTasks(userId: string): Task[] {
  return mockTasks.filter(
    (t) =>
      t.assignedToIds.includes(userId) &&
      (t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'CHANGES_REQUESTED')
  );
}
```

- [ ] **Step 2: Typecheck the migration**

```bash
yarn typecheck 2>&1 | grep -E "mockTasks\.ts|EndOfDayReport"
```
Expected: no errors *originating in* `mockTasks.ts` (downstream callers in `taskActions.ts` and components will still fail — fixed in later tasks).

- [ ] **Step 3: Commit**

```bash
git add lib/mock/mockTasks.ts
git commit -m "feat(tasks): migrate seed tasks to activity-timeline shape"
```

---

## Task 4: Permission helpers

**Files:**
- Create: `lib/tasks/permissions.ts`

- [ ] **Step 1: Write the failing test file**

Create `lib/tasks/permissions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  isPersonalTask,
  canStart,
  canSubmit,
  canReview,
  canBlock,
  canEdit,
  needsMyAction,
  awaitsMyReview,
  binFor,
} from './permissions';
import { Task } from '@/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Task title here',
    description: 'Long enough description',
    assignedToIds: ['user_a'],
    assignedToNames: ['User A'],
    assignedById: 'user_b',
    assignedByName: 'User B',
    department: 'X',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '2026-06-01T17:00:00Z',
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-05-01T09:00:00Z',
    tags: [],
    activity: [],
    isPersonal: false,
    currentRound: 0,
    ...overrides,
  };
}

describe('isPersonalTask', () => {
  it('returns true when assigner equals lone assignee', () => {
    const t = makeTask({ assignedById: 'user_a', assignedToIds: ['user_a'] });
    expect(isPersonalTask(t)).toBe(true);
  });
  it('returns false when assignee differs', () => {
    expect(isPersonalTask(makeTask())).toBe(false);
  });
  it('returns false when multiple assignees', () => {
    const t = makeTask({ assignedById: 'user_a', assignedToIds: ['user_a', 'user_b'] });
    expect(isPersonalTask(t)).toBe(false);
  });
});

describe('canStart', () => {
  it('allows assignee on TODO', () => {
    expect(canStart(makeTask({ status: 'TODO' }), 'user_a')).toBe(true);
  });
  it('blocks non-assignee', () => {
    expect(canStart(makeTask({ status: 'TODO' }), 'user_c')).toBe(false);
  });
  it('allows assignee on CHANGES_REQUESTED (resume work)', () => {
    expect(canStart(makeTask({ status: 'CHANGES_REQUESTED' }), 'user_a')).toBe(true);
  });
  it('blocks on SUBMITTED', () => {
    expect(canStart(makeTask({ status: 'SUBMITTED' }), 'user_a')).toBe(false);
  });
});

describe('canSubmit', () => {
  it('allows assignee on IN_PROGRESS', () => {
    expect(canSubmit(makeTask({ status: 'IN_PROGRESS' }), 'user_a')).toBe(true);
  });
  it('allows assignee on CHANGES_REQUESTED', () => {
    expect(canSubmit(makeTask({ status: 'CHANGES_REQUESTED' }), 'user_a')).toBe(true);
  });
  it('blocks assigner', () => {
    expect(canSubmit(makeTask({ status: 'IN_PROGRESS' }), 'user_b')).toBe(false);
  });
  it('blocks on SUBMITTED (already submitted)', () => {
    expect(canSubmit(makeTask({ status: 'SUBMITTED' }), 'user_a')).toBe(false);
  });
});

describe('canReview', () => {
  it('allows assigner on SUBMITTED for assigned task', () => {
    expect(canReview(makeTask({ status: 'SUBMITTED' }), 'user_b')).toBe(true);
  });
  it('blocks for personal task (no review)', () => {
    const t = makeTask({
      assignedById: 'user_a',
      assignedToIds: ['user_a'],
      status: 'SUBMITTED',
      isPersonal: true,
    });
    expect(canReview(t, 'user_a')).toBe(false);
  });
  it('blocks non-assigner', () => {
    expect(canReview(makeTask({ status: 'SUBMITTED' }), 'user_c')).toBe(false);
  });
  it('blocks when not SUBMITTED', () => {
    expect(canReview(makeTask({ status: 'IN_PROGRESS' }), 'user_b')).toBe(false);
  });
});

describe('canBlock', () => {
  it('allows assignee, assigner; not random user', () => {
    const t = makeTask({ status: 'IN_PROGRESS' });
    expect(canBlock(t, 'user_a')).toBe(true);
    expect(canBlock(t, 'user_b')).toBe(true);
    expect(canBlock(t, 'user_c')).toBe(false);
  });
  it('blocks on terminal states', () => {
    expect(canBlock(makeTask({ status: 'COMPLETED' }), 'user_a')).toBe(false);
    expect(canBlock(makeTask({ status: 'REJECTED' }), 'user_a')).toBe(false);
  });
});

describe('canEdit', () => {
  it('allows assigner until SUBMITTED', () => {
    expect(canEdit(makeTask({ status: 'TODO' }), 'user_b')).toBe(true);
    expect(canEdit(makeTask({ status: 'IN_PROGRESS' }), 'user_b')).toBe(true);
    expect(canEdit(makeTask({ status: 'SUBMITTED' }), 'user_b')).toBe(false);
  });
  it('allows the assignee on personal task', () => {
    const t = makeTask({
      assignedById: 'user_a',
      assignedToIds: ['user_a'],
      isPersonal: true,
      status: 'IN_PROGRESS',
    });
    expect(canEdit(t, 'user_a')).toBe(true);
  });
});

describe('needsMyAction / awaitsMyReview', () => {
  it('flags assigned task needing user submission', () => {
    const t = makeTask({ status: 'IN_PROGRESS' });
    expect(needsMyAction(t, 'user_a')).toBe(true);
    expect(needsMyAction(t, 'user_b')).toBe(false);
  });
  it('flags task awaiting review for assigner', () => {
    const t = makeTask({ status: 'SUBMITTED' });
    expect(awaitsMyReview(t, 'user_b')).toBe(true);
    expect(awaitsMyReview(t, 'user_a')).toBe(false);
  });
});

describe('binFor', () => {
  const now = new Date('2026-05-26T10:00:00Z');
  it('returns awaiting-review for assigner on SUBMITTED', () => {
    expect(binFor(makeTask({ status: 'SUBMITTED' }), 'user_b', now)).toBe('awaiting-review');
  });
  it('returns blocked when status is BLOCKED', () => {
    expect(binFor(makeTask({ status: 'BLOCKED' }), 'user_a', now)).toBe('blocked');
  });
  it('returns overdue when assignee and past due and not closed', () => {
    const t = makeTask({ status: 'IN_PROGRESS', dueDate: '2026-05-20T00:00:00Z' });
    expect(binFor(t, 'user_a', now)).toBe('overdue');
  });
  it('returns due-today when assignee and due today', () => {
    const t = makeTask({ status: 'TODO', dueDate: '2026-05-26T17:00:00Z' });
    expect(binFor(t, 'user_a', now)).toBe('due-today');
  });
  it('returns needs-submit for the assignee on plain IN_PROGRESS', () => {
    const t = makeTask({ status: 'IN_PROGRESS', dueDate: '2026-06-01T00:00:00Z' });
    expect(binFor(t, 'user_a', now)).toBe('needs-submit');
  });
  it('returns null on COMPLETED', () => {
    expect(binFor(makeTask({ status: 'COMPLETED' }), 'user_a', now)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
yarn test lib/tasks/permissions.test.ts
```
Expected: FAIL with "Failed to resolve import './permissions'".

- [ ] **Step 3: Implement the helpers**

Create `lib/tasks/permissions.ts`:

```ts
import { Task } from '@/types';

export function isPersonalTask(task: Task): boolean {
  return (
    task.assignedToIds.length === 1 &&
    task.assignedToIds[0] === task.assignedById
  );
}

const ACTIVE_STATUSES: Task['status'][] = [
  'TODO',
  'IN_PROGRESS',
  'CHANGES_REQUESTED',
  'BLOCKED',
];

const CLOSED_STATUSES: Task['status'][] = ['COMPLETED', 'REJECTED'];

export function canStart(task: Task, userId: string): boolean {
  if (!task.assignedToIds.includes(userId)) return false;
  return task.status === 'TODO' || task.status === 'CHANGES_REQUESTED';
}

export function canSubmit(task: Task, userId: string): boolean {
  if (!task.assignedToIds.includes(userId)) return false;
  return task.status === 'IN_PROGRESS' || task.status === 'CHANGES_REQUESTED';
}

export function canReview(task: Task, userId: string): boolean {
  if (isPersonalTask(task)) return false;
  if (task.assignedById !== userId) return false;
  return task.status === 'SUBMITTED';
}

export function canBlock(task: Task, userId: string): boolean {
  if (CLOSED_STATUSES.includes(task.status)) return false;
  if (task.status === 'SUBMITTED') return false;
  if (task.status === 'BLOCKED') return false;
  return task.assignedToIds.includes(userId) || task.assignedById === userId;
}

export function canUnblock(task: Task, userId: string): boolean {
  if (task.status !== 'BLOCKED') return false;
  return task.assignedToIds.includes(userId) || task.assignedById === userId;
}

export function canEdit(task: Task, userId: string): boolean {
  if (CLOSED_STATUSES.includes(task.status)) return false;
  if (task.status === 'SUBMITTED') return false;
  if (isPersonalTask(task)) return task.assignedById === userId;
  return task.assignedById === userId;
}

export function needsMyAction(task: Task, userId: string): boolean {
  if (!task.assignedToIds.includes(userId)) return false;
  return (
    task.status === 'TODO' ||
    task.status === 'IN_PROGRESS' ||
    task.status === 'CHANGES_REQUESTED'
  );
}

export function awaitsMyReview(task: Task, userId: string): boolean {
  if (isPersonalTask(task)) return false;
  return task.assignedById === userId && task.status === 'SUBMITTED';
}

export type DayBin =
  | 'needs-submit'
  | 'awaiting-review'
  | 'due-today'
  | 'overdue'
  | 'blocked';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function binFor(task: Task, userId: string, now: Date): DayBin | null {
  if (CLOSED_STATUSES.includes(task.status)) return null;
  if (task.status === 'BLOCKED' && (task.assignedToIds.includes(userId) || task.assignedById === userId)) {
    return 'blocked';
  }
  if (awaitsMyReview(task, userId)) return 'awaiting-review';
  if (!task.assignedToIds.includes(userId)) return null;

  const due = new Date(task.dueDate);
  if (due < now && !isSameDay(due, now)) return 'overdue';
  if (isSameDay(due, now)) return 'due-today';
  return 'needs-submit';
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
yarn test lib/tasks/permissions.test.ts
```
Expected: PASS — all suites green.

- [ ] **Step 5: Commit**

```bash
git add lib/tasks/permissions.ts lib/tasks/permissions.test.ts
git commit -m "feat(tasks): permission + day-bin helpers with vitest coverage"
```

---

## Task 5: Server action — `addTask` (personal + assigned + reference attachments)

**Files:**
- Modify: `lib/actions/taskActions.ts`
- Create: `lib/actions/taskActions.test.ts`

- [ ] **Step 1: Replace `taskActions.ts` with the new `addTask` (and stubs for the other actions)**

Open `lib/actions/taskActions.ts`. Replace entire contents with:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { ActionResult, Task, TaskAttachment, TaskActivityEntry, NotificationType } from '@/types';
import {
  taskCreateSchema,
  taskSubmitSchema,
  taskReviewSchema,
  taskBlockSchema,
  taskUnblockSchema,
  taskStartSchema,
  taskEditSchema,
} from '@/lib/validations/task';
import { mockTasks } from '@/lib/mock/mockTasks';
import { mockUsers } from '@/lib/mock/mockUsers';
import { mockNotifications } from '@/lib/mock/mockNotifications';
import { mockAuditLogs } from '@/lib/mock/mockAuditLogs';
import { isPersonalTask, canStart, canSubmit, canReview, canBlock, canUnblock, canEdit } from '@/lib/tasks/permissions';

interface Session {
  userId: string;
  fullName: string;
  role?: string;
}

async function readSession(): Promise<Session> {
  const cookieStore = await cookies();
  const c = cookieStore.get('ypit_session');
  if (!c) return { userId: 'system', fullName: 'System Actions' };
  try {
    const s = JSON.parse(c.value);
    return { userId: s.userId, fullName: s.fullName, role: s.role };
  } catch {
    return { userId: 'system', fullName: 'System Actions' };
  }
}

function collectAttachments(
  formData: FormData,
  prefix: string,
  actor: Session
): TaskAttachment[] {
  const out: TaskAttachment[] = [];
  for (let i = 0; i < 5; i++) {
    const url = (formData.get(`${prefix}_${i}_Url`) as string | null) ?? '';
    if (!url) continue;
    const filename = (formData.get(`${prefix}_${i}_Filename`) as string | null) ?? 'file';
    const contentType = (formData.get(`${prefix}_${i}_ContentType`) as string | null) ?? 'application/octet-stream';
    const sizeStr = (formData.get(`${prefix}_${i}_Size`) as string | null) ?? '0';
    out.push({
      url,
      filename,
      contentType,
      size: parseInt(sizeStr, 10) || 0,
      uploadedAt: new Date().toISOString(),
      uploadedById: actor.userId,
      uploadedByName: actor.fullName,
    });
  }
  return out;
}

function genActivityId(prefix: string): string {
  return `act_${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function pushNotification(userId: string, title: string, message: string, type: NotificationType, taskId: string) {
  if (!userId || userId === 'system') return;
  mockNotifications.unshift({
    id: `ntf_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    title,
    message,
    type,
    read: false,
    link: `/tasks?taskId=${taskId}`,
    entityId: taskId,
    createdAt: new Date().toISOString(),
  });
}

function pushAuditLog(actor: Session, action: 'TASK_ASSIGNED' | 'TASK_SUBMITTED' | 'TASK_REVIEWED' | 'TASK_BLOCKED', detail: string, taskId: string) {
  mockAuditLogs.unshift({
    id: `aud_${Math.random().toString(36).slice(2, 9)}`,
    userId: actor.userId,
    userName: actor.fullName,
    userRole: (actor.role as any) ?? 'OPERATIONS',
    action,
    module: 'tasks',
    detail,
    entityId: taskId,
    entityType: 'task',
    timestamp: new Date().toISOString(),
  });
}

export async function addTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = taskCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the form validation errors.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const actor = await readSession();
  const assigneeIdRaw = parsed.data.assignedToId?.trim();
  const isSelfAssign = !assigneeIdRaw || assigneeIdRaw === actor.userId;
  const assignee = isSelfAssign
    ? mockUsers.find((u) => u.id === actor.userId)
    : mockUsers.find((u) => u.id === assigneeIdRaw);

  if (!isSelfAssign && !assignee) {
    return { success: false, message: 'Invalid assignee selected.' };
  }

  const resolvedAssigneeId = assignee?.id ?? actor.userId;
  const resolvedAssigneeName = assignee?.fullName ?? actor.fullName;
  const resolvedDepartment = assignee?.department ?? 'Personal';
  const isPersonal = resolvedAssigneeId === actor.userId;

  const referenceAttachments = collectAttachments(formData, 'reference', actor);
  const tags = (parsed.data.tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const createdEntry: TaskActivityEntry = {
    id: genActivityId('created'),
    type: 'CREATED',
    at: new Date().toISOString(),
    actorId: actor.userId,
    actorName: actor.fullName,
    attachments: referenceAttachments.length > 0 ? referenceAttachments : undefined,
  };

  const newTask: Task = {
    id: `tsk_${Math.random().toString(36).slice(2, 9)}`,
    title: parsed.data.title,
    description: parsed.data.description,
    assignedToIds: [resolvedAssigneeId],
    assignedToNames: [resolvedAssigneeName],
    assignedById: actor.userId,
    assignedByName: actor.fullName,
    department: resolvedDepartment,
    priority: parsed.data.priority,
    status: 'TODO',
    dueDate: new Date(parsed.data.dueDate).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags,
    referenceAttachments: referenceAttachments.length > 0 ? referenceAttachments : undefined,
    activity: [createdEntry],
    isPersonal,
    currentRound: 0,
  };

  mockTasks.unshift(newTask);

  if (!isPersonal) {
    pushNotification(
      resolvedAssigneeId,
      `New task: ${newTask.title}`,
      `Assigned by ${actor.fullName}`,
      'TASK_ASSIGNED',
      newTask.id
    );
    pushAuditLog(actor, 'TASK_ASSIGNED', `Assigned "${newTask.title}" to ${resolvedAssigneeName}`, newTask.id);
  }

  revalidatePath('/tasks');
  return {
    success: true,
    message: isPersonal ? 'Personal task added.' : 'Task assigned successfully!',
  };
}

// The remaining actions get implemented in later tasks.
// Stubs so the file typechecks:
export async function startTask(_prev: unknown, _formData: FormData): Promise<ActionResult> {
  return { success: false, message: 'Not implemented yet' };
}
export async function blockTask(_prev: unknown, _formData: FormData): Promise<ActionResult> {
  return { success: false, message: 'Not implemented yet' };
}
export async function unblockTask(_prev: unknown, _formData: FormData): Promise<ActionResult> {
  return { success: false, message: 'Not implemented yet' };
}
export async function submitTaskReport(_prev: unknown, _formData: FormData): Promise<ActionResult> {
  return { success: false, message: 'Not implemented yet' };
}
export async function reviewTask(_prev: unknown, _formData: FormData): Promise<ActionResult> {
  return { success: false, message: 'Not implemented yet' };
}
export async function editTask(_prev: unknown, _formData: FormData): Promise<ActionResult> {
  return { success: false, message: 'Not implemented yet' };
}
```

- [ ] **Step 2: Write the test file**

Create `lib/actions/taskActions.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addTask } from './taskActions';
import { mockTasks } from '@/lib/mock/mockTasks';
import { mockNotifications } from '@/lib/mock/mockNotifications';
import { mockAuditLogs } from '@/lib/mock/mockAuditLogs';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'ypit_session'
        ? {
            value: JSON.stringify({
              userId: 'usr_001',
              fullName: 'David Mwangi',
              role: 'MANAGING_DIRECTOR',
            }),
          }
        : undefined,
  }),
}));

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  Object.entries(obj).forEach(([k, v]) => f.append(k, v));
  return f;
}

beforeEach(() => {
  mockTasks.length = 0;
  mockNotifications.length = 0;
  mockAuditLogs.length = 0;
});

describe('addTask', () => {
  it('rejects when required fields missing', async () => {
    const r = await addTask(null, fd({ title: 'too' }));
    expect(r.success).toBe(false);
    expect(r.errors).toBeDefined();
  });

  it('creates an assigned task and notifies assignee', async () => {
    const r = await addTask(
      null,
      fd({
        title: 'Follow up with student',
        description: 'Ten characters or more please',
        priority: 'HIGH',
        dueDate: '2026-06-01',
        assignedToId: 'usr_005',
      })
    );
    expect(r.success).toBe(true);
    expect(mockTasks).toHaveLength(1);
    const t = mockTasks[0];
    expect(t.assignedToIds).toEqual(['usr_005']);
    expect(t.assignedById).toBe('usr_001');
    expect(t.isPersonal).toBe(false);
    expect(t.status).toBe('TODO');
    expect(t.activity).toHaveLength(1);
    expect(t.activity[0].type).toBe('CREATED');
    expect(mockNotifications.some((n) => n.userId === 'usr_005' && n.type === 'TASK_ASSIGNED')).toBe(true);
    expect(mockAuditLogs.some((a) => a.action === 'TASK_ASSIGNED')).toBe(true);
  });

  it('creates a personal task when assignee omitted', async () => {
    const r = await addTask(
      null,
      fd({
        title: 'Tidy my queue',
        description: 'A personal reminder for me to action.',
        priority: 'LOW',
        dueDate: '2026-06-02',
      })
    );
    expect(r.success).toBe(true);
    const t = mockTasks[0];
    expect(t.isPersonal).toBe(true);
    expect(t.assignedToIds).toEqual(['usr_001']);
    expect(mockNotifications).toHaveLength(0);
  });

  it('treats self-assignment as personal', async () => {
    await addTask(
      null,
      fd({
        title: 'Block out review time',
        description: 'A reminder I send to myself.',
        priority: 'MEDIUM',
        dueDate: '2026-06-02',
        assignedToId: 'usr_001',
      })
    );
    expect(mockTasks[0].isPersonal).toBe(true);
  });

  it('stores reference attachments under both fields', async () => {
    const r = await addTask(
      null,
      fd({
        title: 'Brief Sarah on the change',
        description: 'Share the new fee structure with marketing.',
        priority: 'MEDIUM',
        dueDate: '2026-06-03',
        assignedToId: 'usr_002',
        reference_0_Url: 'data:image/png;base64,AAAA',
        reference_0_Filename: 'brief.png',
        reference_0_ContentType: 'image/png',
        reference_0_Size: '1024',
      })
    );
    expect(r.success).toBe(true);
    const t = mockTasks[0];
    expect(t.referenceAttachments).toHaveLength(1);
    expect(t.referenceAttachments![0].filename).toBe('brief.png');
    expect(t.activity[0].attachments).toHaveLength(1);
  });

  it('parses comma-separated tags into an array', async () => {
    await addTask(
      null,
      fd({
        title: 'Send out invoices',
        description: 'End-of-month batch.',
        priority: 'HIGH',
        dueDate: '2026-06-04',
        assignedToId: 'usr_004',
        tags: 'Finance, Monthly , Invoices ',
      })
    );
    expect(mockTasks[0].tags).toEqual(['Finance', 'Monthly', 'Invoices']);
  });
});
```

- [ ] **Step 3: Run the tests and confirm they pass**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: PASS — all six `addTask` cases green.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/taskActions.ts lib/actions/taskActions.test.ts
git commit -m "feat(tasks): addTask supports personal, assigned, attachments, tags"
```

---

## Task 6: Server actions — `startTask`, `blockTask`, `unblockTask`

**Files:**
- Modify: `lib/actions/taskActions.ts`
- Modify: `lib/actions/taskActions.test.ts`

- [ ] **Step 1: Write the failing tests (append to test file)**

Append to `lib/actions/taskActions.test.ts` after the existing `describe('addTask', …)` block:

```ts
import { startTask, blockTask, unblockTask } from './taskActions';
import { Task } from '@/types';

function seed(t: Partial<Task> = {}): Task {
  const task: Task = {
    id: 'tsk_seed',
    title: 'Seed title here',
    description: 'A description long enough',
    assignedToIds: ['usr_005'],
    assignedToNames: ['Peter Njoroge'],
    assignedById: 'usr_001',
    assignedByName: 'David Mwangi',
    department: 'Admissions',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '2026-06-01T00:00:00Z',
    createdAt: '2026-05-26T09:00:00Z',
    updatedAt: '2026-05-26T09:00:00Z',
    tags: [],
    activity: [
      {
        id: 'act_seed_created',
        type: 'CREATED',
        at: '2026-05-26T09:00:00Z',
        actorId: 'usr_001',
        actorName: 'David Mwangi',
      },
    ],
    isPersonal: false,
    currentRound: 0,
    ...t,
  };
  mockTasks.unshift(task);
  return task;
}

describe('startTask', () => {
  it('blocks non-assignee', async () => {
    seed({ assignedToIds: ['usr_002'] });
    const r = await startTask(null, fd({ taskId: 'tsk_seed' }));
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/not allowed|cannot/i);
  });

  it('moves TODO → IN_PROGRESS and appends STARTED activity (session = assignee)', async () => {
    seed({ assignedToIds: ['usr_001'] });
    const r = await startTask(null, fd({ taskId: 'tsk_seed' }));
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('IN_PROGRESS');
    expect(t.activity.at(-1)!.type).toBe('STARTED');
  });
});

describe('blockTask', () => {
  it('requires a reason', async () => {
    seed({ assignedToIds: ['usr_001'], status: 'IN_PROGRESS' });
    const r = await blockTask(null, fd({ taskId: 'tsk_seed', reason: 'no' }));
    expect(r.success).toBe(false);
  });

  it('moves to BLOCKED with reason and emits audit log', async () => {
    seed({ assignedToIds: ['usr_001'], status: 'IN_PROGRESS' });
    const r = await blockTask(
      null,
      fd({ taskId: 'tsk_seed', reason: 'Waiting on visa confirmation from embassy' })
    );
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('BLOCKED');
    expect(t.activity.at(-1)!.type).toBe('BLOCKED');
    expect(t.activity.at(-1)!.note).toMatch(/embassy/);
    expect(mockAuditLogs.some((a) => a.action === 'TASK_BLOCKED')).toBe(true);
  });
});

describe('unblockTask', () => {
  it('moves BLOCKED → IN_PROGRESS and appends UNBLOCKED activity', async () => {
    seed({ assignedToIds: ['usr_001'], status: 'BLOCKED' });
    const r = await unblockTask(null, fd({ taskId: 'tsk_seed' }));
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('IN_PROGRESS');
    expect(t.activity.at(-1)!.type).toBe('UNBLOCKED');
  });
});
```

- [ ] **Step 2: Run the new tests and confirm they fail**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: FAIL — the three new `describe` blocks fail because the stubs return `Not implemented yet`.

- [ ] **Step 3: Implement the actions**

In `lib/actions/taskActions.ts`, replace the three stub functions (`startTask`, `blockTask`, `unblockTask`) with real implementations:

```ts
export async function startTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskStartSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: 'Invalid input.' };

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canStart(task, actor.userId)) {
    return { success: false, message: 'You cannot start this task.' };
  }

  task.status = 'IN_PROGRESS';
  task.updatedAt = new Date().toISOString();
  task.activity.push({
    id: genActivityId('started'),
    type: 'STARTED',
    at: task.updatedAt,
    actorId: actor.userId,
    actorName: actor.fullName,
  });

  revalidatePath('/tasks');
  return { success: true, message: 'Task started.' };
}

export async function blockTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskBlockSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: 'Block reason must be at least 3 characters.' };
  }

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canBlock(task, actor.userId)) {
    return { success: false, message: 'You cannot block this task.' };
  }

  task.status = 'BLOCKED';
  task.updatedAt = new Date().toISOString();
  task.activity.push({
    id: genActivityId('blocked'),
    type: 'BLOCKED',
    at: task.updatedAt,
    actorId: actor.userId,
    actorName: actor.fullName,
    note: parsed.data.reason,
  });
  pushAuditLog(actor, 'TASK_BLOCKED', `Blocked "${task.title}": ${parsed.data.reason}`, task.id);
  if (!isPersonalTask(task)) {
    pushNotification(
      task.assignedById,
      `Task blocked: ${task.title}`,
      parsed.data.reason,
      'SYSTEM_ALERT',
      task.id
    );
  }

  revalidatePath('/tasks');
  return { success: true, message: 'Task blocked.' };
}

export async function unblockTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskUnblockSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: 'Invalid input.' };

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canUnblock(task, actor.userId)) {
    return { success: false, message: 'You cannot unblock this task.' };
  }

  task.status = 'IN_PROGRESS';
  task.updatedAt = new Date().toISOString();
  task.activity.push({
    id: genActivityId('unblocked'),
    type: 'UNBLOCKED',
    at: task.updatedAt,
    actorId: actor.userId,
    actorName: actor.fullName,
  });

  revalidatePath('/tasks');
  return { success: true, message: 'Task unblocked.' };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: PASS — all `startTask` / `blockTask` / `unblockTask` cases green.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/taskActions.ts lib/actions/taskActions.test.ts
git commit -m "feat(tasks): start, block, unblock lifecycle actions"
```

---

## Task 7: Server action — `submitTaskReport` (personal closes, assigned → SUBMITTED)

**Files:**
- Modify: `lib/actions/taskActions.ts`
- Modify: `lib/actions/taskActions.test.ts`

- [ ] **Step 1: Append the failing tests**

Append to `lib/actions/taskActions.test.ts`:

```ts
import { submitTaskReport } from './taskActions';

describe('submitTaskReport', () => {
  it('blocks non-assignee', async () => {
    seed({ assignedToIds: ['usr_002'], status: 'IN_PROGRESS' });
    const r = await submitTaskReport(
      null,
      fd({
        taskId: 'tsk_seed',
        summary: 'Short summary',
        progressMade: 'Did the thing for ten chars',
        percentageComplete: '50',
      })
    );
    expect(r.success).toBe(false);
  });

  it('moves assigned task IN_PROGRESS → SUBMITTED and notifies assigner', async () => {
    seed({ assignedToIds: ['usr_001'], status: 'IN_PROGRESS', assignedById: 'usr_002', assignedByName: 'Sarah' });
    const r = await submitTaskReport(
      null,
      fd({
        taskId: 'tsk_seed',
        summary: 'Initial draft done',
        progressMade: 'Wrote the brief and circulated.',
        percentageComplete: '60',
        nextActions: 'Wait for feedback',
      })
    );
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('SUBMITTED');
    expect(t.currentRound).toBe(1);
    expect(t.activity.at(-1)!.type).toBe('SUBMITTED');
    expect(t.activity.at(-1)!.progressMade).toMatch(/brief/);
    expect(mockNotifications.some((n) => n.userId === 'usr_002' && n.type === 'REPORT_SUBMITTED')).toBe(true);
  });

  it('moves personal task IN_PROGRESS → COMPLETED with no review needed', async () => {
    seed({
      assignedToIds: ['usr_001'],
      assignedById: 'usr_001',
      assignedByName: 'David Mwangi',
      isPersonal: true,
      status: 'IN_PROGRESS',
    });
    const r = await submitTaskReport(
      null,
      fd({
        taskId: 'tsk_seed',
        summary: 'Reviewed inbox',
        progressMade: 'Cleared the queue and replied.',
        percentageComplete: '100',
      })
    );
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('COMPLETED');
    expect(t.currentRound).toBe(1);
  });

  it('supports resubmission from CHANGES_REQUESTED and increments currentRound', async () => {
    seed({
      assignedToIds: ['usr_001'],
      assignedById: 'usr_002',
      assignedByName: 'Sarah',
      status: 'CHANGES_REQUESTED',
      currentRound: 1,
    });
    const r = await submitTaskReport(
      null,
      fd({
        taskId: 'tsk_seed',
        summary: 'Updated per feedback',
        progressMade: 'Reworked the section flagged by reviewer.',
        percentageComplete: '85',
      })
    );
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('SUBMITTED');
    expect(t.currentRound).toBe(2);
  });

  it('attaches deliverable files when present', async () => {
    seed({ assignedToIds: ['usr_001'], status: 'IN_PROGRESS', assignedById: 'usr_002', assignedByName: 'Sarah' });
    const r = await submitTaskReport(
      null,
      fd({
        taskId: 'tsk_seed',
        summary: 'Drafted the doc',
        progressMade: 'Attached the final PDF for review.',
        percentageComplete: '100',
        deliverable_0_Url: 'data:application/pdf;base64,JVB',
        deliverable_0_Filename: 'report.pdf',
        deliverable_0_ContentType: 'application/pdf',
        deliverable_0_Size: '2048',
      })
    );
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.activity.at(-1)!.attachments).toHaveLength(1);
    expect(t.activity.at(-1)!.attachments![0].filename).toBe('report.pdf');
  });
});
```

- [ ] **Step 2: Run the new tests and confirm they fail**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: FAIL on the five `submitTaskReport` cases (stub returns "Not implemented yet").

- [ ] **Step 3: Replace the `submitTaskReport` stub**

In `lib/actions/taskActions.ts`, replace the `submitTaskReport` stub with:

```ts
export async function submitTaskReport(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskSubmitSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the form validation errors.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canSubmit(task, actor.userId)) {
    return { success: false, message: 'You cannot submit this task.' };
  }

  const attachments = collectAttachments(formData, 'deliverable', actor);
  const entry: TaskActivityEntry = {
    id: genActivityId('submitted'),
    type: 'SUBMITTED',
    at: new Date().toISOString(),
    actorId: actor.userId,
    actorName: actor.fullName,
    note: parsed.data.summary,
    progressMade: parsed.data.progressMade,
    percentageComplete: parsed.data.percentageComplete,
    nextActions: parsed.data.nextActions,
    blockers: parsed.data.blockers,
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  task.activity.push(entry);
  task.currentRound += 1;
  task.updatedAt = entry.at;
  task.status = isPersonalTask(task) ? 'COMPLETED' : 'SUBMITTED';

  pushAuditLog(actor, 'TASK_SUBMITTED', `Submitted "${task.title}" (round ${task.currentRound})`, task.id);
  if (!isPersonalTask(task)) {
    pushNotification(
      task.assignedById,
      `Report submitted: ${task.title}`,
      `From ${actor.fullName} — ${parsed.data.summary}`,
      'REPORT_SUBMITTED',
      task.id
    );
  }

  revalidatePath('/tasks');
  return { success: true, message: 'Report submitted.' };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: PASS — all `submitTaskReport` cases green.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/taskActions.ts lib/actions/taskActions.test.ts
git commit -m "feat(tasks): submitTaskReport (personal closes, assigned → SUBMITTED)"
```

---

## Task 8: Server action — `reviewTask` (Approve / Request changes / Reject)

**Files:**
- Modify: `lib/actions/taskActions.ts`
- Modify: `lib/actions/taskActions.test.ts`

- [ ] **Step 1: Append the failing tests**

Append to `lib/actions/taskActions.test.ts`:

```ts
import { reviewTask } from './taskActions';

describe('reviewTask', () => {
  function submittedSeed() {
    return seed({
      assignedToIds: ['usr_005'],
      assignedToNames: ['Peter Njoroge'],
      assignedById: 'usr_001',
      assignedByName: 'David Mwangi',
      status: 'SUBMITTED',
      currentRound: 1,
    });
  }

  it('blocks non-assigner', async () => {
    // Session is usr_001 (assigner). Set assigner to someone else so this user cannot review.
    seed({ assignedById: 'usr_002', status: 'SUBMITTED' });
    const r = await reviewTask(null, fd({ taskId: 'tsk_seed', decision: 'APPROVE' }));
    expect(r.success).toBe(false);
  });

  it('blocks when status is not SUBMITTED', async () => {
    seed({ status: 'IN_PROGRESS' });
    const r = await reviewTask(null, fd({ taskId: 'tsk_seed', decision: 'APPROVE' }));
    expect(r.success).toBe(false);
  });

  it('APPROVE moves SUBMITTED → COMPLETED and notifies assignee', async () => {
    submittedSeed();
    const r = await reviewTask(null, fd({ taskId: 'tsk_seed', decision: 'APPROVE' }));
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('COMPLETED');
    expect(t.activity.at(-1)!.type).toBe('APPROVED');
    expect(mockNotifications.some((n) => n.userId === 'usr_005' && n.type === 'TASK_REVIEWED')).toBe(true);
  });

  it('REQUEST_CHANGES requires a note and reopens to CHANGES_REQUESTED', async () => {
    submittedSeed();
    const noNote = await reviewTask(null, fd({ taskId: 'tsk_seed', decision: 'REQUEST_CHANGES' }));
    expect(noNote.success).toBe(false);

    submittedSeed();
    const r = await reviewTask(
      null,
      fd({ taskId: 'tsk_seed', decision: 'REQUEST_CHANGES', note: 'Add the cost breakdown please.' })
    );
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('CHANGES_REQUESTED');
    expect(t.activity.at(-1)!.type).toBe('CHANGES_REQUESTED');
    expect(t.activity.at(-1)!.note).toMatch(/cost breakdown/);
  });

  it('REJECT requires a note and moves to terminal REJECTED', async () => {
    submittedSeed();
    const r = await reviewTask(
      null,
      fd({ taskId: 'tsk_seed', decision: 'REJECT', note: 'Out of scope for this quarter.' })
    );
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.status).toBe('REJECTED');
    expect(mockAuditLogs.some((a) => a.action === 'TASK_REVIEWED')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: FAIL on the five `reviewTask` cases.

- [ ] **Step 3: Replace the `reviewTask` stub**

In `lib/actions/taskActions.ts`, replace the `reviewTask` stub with:

```ts
export async function reviewTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskReviewSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors[0]?.message ?? 'Invalid input.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canReview(task, actor.userId)) {
    return { success: false, message: 'You cannot review this task.' };
  }

  const now = new Date().toISOString();
  let nextStatus: Task['status'];
  let activityType: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  let notifTitle: string;

  switch (parsed.data.decision) {
    case 'APPROVE':
      nextStatus = 'COMPLETED';
      activityType = 'APPROVED';
      notifTitle = `Task approved: ${task.title}`;
      break;
    case 'REQUEST_CHANGES':
      nextStatus = 'CHANGES_REQUESTED';
      activityType = 'CHANGES_REQUESTED';
      notifTitle = `Changes requested: ${task.title}`;
      break;
    case 'REJECT':
      nextStatus = 'REJECTED';
      activityType = 'REJECTED';
      notifTitle = `Task rejected: ${task.title}`;
      break;
  }

  task.status = nextStatus;
  task.updatedAt = now;
  task.activity.push({
    id: genActivityId('review'),
    type: activityType,
    at: now,
    actorId: actor.userId,
    actorName: actor.fullName,
    note: parsed.data.note,
  });

  pushAuditLog(actor, 'TASK_REVIEWED', `${parsed.data.decision} on "${task.title}"`, task.id);
  task.assignedToIds.forEach((aid) =>
    pushNotification(
      aid,
      notifTitle,
      parsed.data.note ?? 'No additional notes.',
      'TASK_REVIEWED',
      task.id
    )
  );

  revalidatePath('/tasks');
  return { success: true, message: 'Review recorded.' };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: PASS — all `reviewTask` cases green.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/taskActions.ts lib/actions/taskActions.test.ts
git commit -m "feat(tasks): reviewTask handles approve, request changes, reject"
```

---

## Task 9: Server action — `editTask` (pre-SUBMITTED light edits)

**Files:**
- Modify: `lib/actions/taskActions.ts`
- Modify: `lib/actions/taskActions.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `lib/actions/taskActions.test.ts`:

```ts
import { editTask } from './taskActions';

describe('editTask', () => {
  it('blocks non-assigner', async () => {
    seed({ assignedById: 'usr_999', status: 'TODO' });
    const r = await editTask(null, fd({ taskId: 'tsk_seed', title: 'New title here' }));
    expect(r.success).toBe(false);
  });

  it('blocks once SUBMITTED', async () => {
    seed({ assignedById: 'usr_001', status: 'SUBMITTED' });
    const r = await editTask(null, fd({ taskId: 'tsk_seed', title: 'New title here' }));
    expect(r.success).toBe(false);
  });

  it('updates fields and appends EDITED activity', async () => {
    seed({ assignedById: 'usr_001', status: 'TODO' });
    const r = await editTask(
      null,
      fd({
        taskId: 'tsk_seed',
        title: 'Refreshed task title',
        priority: 'URGENT',
        tags: 'Q2, Critical',
      })
    );
    expect(r.success).toBe(true);
    const t = mockTasks.find((x) => x.id === 'tsk_seed')!;
    expect(t.title).toBe('Refreshed task title');
    expect(t.priority).toBe('URGENT');
    expect(t.tags).toEqual(['Q2', 'Critical']);
    expect(t.activity.at(-1)!.type).toBe('EDITED');
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: FAIL on `editTask` cases.

- [ ] **Step 3: Replace the `editTask` stub**

```ts
export async function editTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskEditSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the form validation errors.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canEdit(task, actor.userId)) {
    return { success: false, message: 'You cannot edit this task.' };
  }

  const changes: string[] = [];
  if (parsed.data.title && parsed.data.title !== task.title) {
    changes.push(`title: "${task.title}" → "${parsed.data.title}"`);
    task.title = parsed.data.title;
  }
  if (parsed.data.description && parsed.data.description !== task.description) {
    changes.push('description updated');
    task.description = parsed.data.description;
  }
  if (parsed.data.priority && parsed.data.priority !== task.priority) {
    changes.push(`priority: ${task.priority} → ${parsed.data.priority}`);
    task.priority = parsed.data.priority;
  }
  if (parsed.data.dueDate) {
    const next = new Date(parsed.data.dueDate).toISOString();
    if (next !== task.dueDate) {
      changes.push(`due date updated`);
      task.dueDate = next;
    }
  }
  if (parsed.data.tags !== undefined) {
    const nextTags = parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (JSON.stringify(nextTags) !== JSON.stringify(task.tags)) {
      changes.push('tags updated');
      task.tags = nextTags;
    }
  }

  if (changes.length === 0) {
    return { success: true, message: 'No changes to save.' };
  }

  task.updatedAt = new Date().toISOString();
  task.activity.push({
    id: genActivityId('edited'),
    type: 'EDITED',
    at: task.updatedAt,
    actorId: actor.userId,
    actorName: actor.fullName,
    note: changes.join('; '),
  });

  revalidatePath('/tasks');
  return { success: true, message: 'Task updated.' };
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
yarn test lib/actions/taskActions.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/taskActions.ts lib/actions/taskActions.test.ts
git commit -m "feat(tasks): editTask for pre-SUBMITTED field changes"
```

---

## Task 10: `MultiAttachmentField` component

**Files:**
- Create: `components/shared/MultiAttachmentField.tsx`

- [ ] **Step 1: Create the component**

Create `components/shared/MultiAttachmentField.tsx`:

```tsx
'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Paperclip, X, FileText, Image as ImageIcon, File } from 'lucide-react';

const ACCEPT =
  'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.doc,.docx,.xls,.xlsx';
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_FILES = 5;

function iconFor(contentType: string) {
  if (contentType.startsWith('image/')) return ImageIcon;
  if (contentType === 'application/pdf' || contentType.includes('officedocument') || contentType.includes('ms-'))
    return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface Slot {
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

interface Props {
  name: string;
  label: string;
  helperText?: string;
}

export function MultiAttachmentField({ name, label, helperText }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const next: Slot[] = [...slots];
      for (const file of Array.from(files)) {
        if (next.length >= MAX_FILES) {
          toast.warning(`Max ${MAX_FILES} files. Skipping ${file.name}.`);
          break;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is too large — max ${formatSize(MAX_BYTES)}.`);
          continue;
        }
        const url = await readAsDataUrl(file);
        next.push({
          url,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
        });
      }
      setSlots(next);
    } catch {
      toast.error('Could not read one or more files.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx: number) => setSlots((s) => s.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      {slots.map((slot, i) => {
        const Icon = iconFor(slot.contentType);
        return (
          <div key={i}>
            <input type="hidden" name={`${name}_${i}_Url`} value={slot.url} />
            <input type="hidden" name={`${name}_${i}_Filename`} value={slot.filename} />
            <input type="hidden" name={`${name}_${i}_ContentType`} value={slot.contentType} />
            <input type="hidden" name={`${name}_${i}_Size`} value={String(slot.size)} />
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
              <span className="w-9 h-9 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{slot.filename}</p>
                <p className="text-[11px] text-gray-500">
                  {formatSize(slot.size)} · {slot.contentType || 'unknown'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="w-7 h-7 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-500"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {slots.length < MAX_FILES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary hover:text-primary hover:bg-primary-muted/40 transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-4 h-4" />
          {busy ? 'Reading file…' : slots.length === 0 ? 'Attach file(s)' : 'Add another'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <p className="text-[11px] text-gray-400">
        {helperText ?? `Images, PDF, Word, Excel. Up to ${MAX_FILES} files, max ${formatSize(MAX_BYTES)} each.`}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
yarn typecheck
```
Expected: no errors *from* `MultiAttachmentField.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/shared/MultiAttachmentField.tsx
git commit -m "feat(shared): MultiAttachmentField (up to 5 files, indexed hidden inputs)"
```

---

## Task 11: `StatusBadge` task variant

**Files:**
- Modify: `components/shared/StatusBadge.tsx`

- [ ] **Step 1: Add the task colour map**

Open `components/shared/StatusBadge.tsx`. After the `pipelineColors` constant (around line 19), add:

```ts
const taskColors: Record<string, { text: string; bg: string; fontWeight?: string }> = {
  TODO: { text: '#374151', bg: '#f3f4f6' },
  IN_PROGRESS: { text: '#1d4ed8', bg: '#dbeafe' },
  SUBMITTED: { text: '#6d28d9', bg: '#ede9fe' },
  CHANGES_REQUESTED: { text: '#b45309', bg: '#fef3c7' },
  REJECTED: { text: '#b91c1c', bg: '#fee2e2' },
  COMPLETED: { text: '#15803d', bg: '#dcfce7' },
  BLOCKED: { text: '#ffffff', bg: '#b91c1c', fontWeight: '600' },
};
```

Then in the `StatusBadge` function, after the existing `if (variant === 'pipeline' …)` block, add:

```ts
  if (variant === 'task' && taskColors[status]) {
    colors = { ...colors, ...taskColors[status] };
  }
```

- [ ] **Step 2: Typecheck**

```bash
yarn typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/shared/StatusBadge.tsx
git commit -m "feat(shared): StatusBadge task variant with new statuses"
```

---

## Task 12: `CreateTaskForm` — personal toggle, tags, reference attachments

**Files:**
- Modify: `app/(dashboard)/tasks/_components/CreateTaskForm.tsx`

- [ ] **Step 1: Replace the form**

Replace the entire contents of `app/(dashboard)/tasks/_components/CreateTaskForm.tsx` with:

```tsx
'use client';

import { useActionState, useEffect, useState } from 'react';
import { addTask } from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { mockUsers } from '@/lib/mock/mockUsers';
import { CustomSelect } from '@/components/ui/custom-select';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiAttachmentField } from '@/components/shared/MultiAttachmentField';

const PERSONAL = '__personal__';

export function CreateTaskForm({ onSuccess, currentUserId }: { onSuccess: () => void; currentUserId: string }) {
  const [state, formAction, isPending] = useActionState(addTask, null);
  const [assignee, setAssignee] = useState<string>(PERSONAL);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const isPersonal = assignee === PERSONAL || assignee === currentUserId;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input id="title" name="title" placeholder="e.g. Follow up on student visa…" required />
        {state?.errors?.title && <p className="text-red-500 text-xs">{state.errors.title[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detailed Description *</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Explain what completion looks like, the inputs, and any constraints."
          required
        />
        {state?.errors?.description && <p className="text-red-500 text-xs">{state.errors.description[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <CustomSelect
            name="priority"
            required
            defaultValue="MEDIUM"
            options={[
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'High', value: 'HIGH' },
              { label: 'Urgent!', value: 'URGENT' },
            ]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <DatePicker name="dueDate" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedToId">Assign To</Label>
        <CustomSelect
          name="assignedToId"
          value={assignee}
          onChange={(v) => setAssignee(v)}
          options={[
            { label: 'Me (personal task)', value: PERSONAL },
            ...mockUsers
              .filter((u) => u.id !== currentUserId)
              .map((u) => ({ label: `${u.fullName} (${u.role})`, value: u.id })),
          ]}
        />
        <p className="text-[11px] text-gray-500">
          {isPersonal
            ? 'Personal tasks close on submit — no review.'
            : 'The assignee will be notified. You will review their submission.'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="Comma-separated, e.g. Q2, Finance, Urgent" />
      </div>

      <MultiAttachmentField name="reference" label="Reference materials (optional)" />

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isPersonal ? 'Add Personal Task' : 'Assign Task'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Update the `CreateTaskButton` to pass `currentUserId`**

Open `app/(dashboard)/tasks/_components/CreateTaskButton.tsx`. Replace contents with:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { CreateTaskForm } from './CreateTaskForm';
import { Plus } from 'lucide-react';

export function CreateTaskButton({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary hover:bg-primary-light text-white">
        <Plus className="w-4 h-4" />
        Create Task
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Task"
        description="Personal reminder or work for a teammate — same form, both supported."
      >
        <CreateTaskForm onSuccess={() => setIsOpen(false)} currentUserId={currentUserId} />
      </SlideInPanel>
    </>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
yarn typecheck
```
Expected: errors *only* in `app/(dashboard)/tasks/page.tsx` (because the new prop is unprovided) — fixed in Task 19.

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/tasks/_components/CreateTaskForm.tsx app/\(dashboard\)/tasks/_components/CreateTaskButton.tsx
git commit -m "feat(tasks): create-task form supports personal, tags, reference files"
```

---

## Task 13: `SubmitTaskForm` (replaces `ReportTaskForm`)

**Files:**
- Create: `app/(dashboard)/tasks/_components/SubmitTaskForm.tsx`
- Delete: `app/(dashboard)/tasks/_components/ReportTaskForm.tsx`

- [ ] **Step 1: Create the new form**

Create `app/(dashboard)/tasks/_components/SubmitTaskForm.tsx`:

```tsx
'use client';

import { useActionState, useEffect } from 'react';
import { submitTaskReport } from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';
import { MultiAttachmentField } from '@/components/shared/MultiAttachmentField';
import { toast } from 'sonner';
import { Task } from '@/types';
import { isPersonalTask } from '@/lib/tasks/permissions';

export function SubmitTaskForm({ task, onSuccess }: { task: Task; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(submitTaskReport, null);
  const personal = isPersonalTask(task);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="taskId" value={task.id} />

      <div className="bg-gray-50 border border-gray-100 p-3 rounded-md mb-4">
        <h4 className="font-urbanist font-bold text-gray-900 line-clamp-1">{task.title}</h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary *</Label>
        <Input id="summary" name="summary" placeholder="One sentence: where things stand" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="progressMade">Progress made *</Label>
        <Textarea
          id="progressMade"
          name="progressMade"
          placeholder="What was accomplished against this task?"
          required
          className="h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="percentageComplete">Completion *</Label>
          <CustomSelect
            name="percentageComplete"
            required
            defaultValue="100"
            options={[
              { label: '0% — Just started', value: '0' },
              { label: '25%', value: '25' },
              { label: '50%', value: '50' },
              { label: '75%', value: '75' },
              { label: '100% — Done', value: '100' },
            ]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextActions">Next actions</Label>
        <Input id="nextActions" name="nextActions" placeholder="What would you do next?" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blockers">Blockers / delays</Label>
        <Textarea id="blockers" name="blockers" placeholder="Waiting on anyone or anything?" className="h-16" />
      </div>

      <MultiAttachmentField name="deliverable" label="Deliverables (optional)" />

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting…' : personal ? 'Mark Complete' : 'Submit for review'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Delete the obsolete `ReportTaskForm`**

```bash
rm app/\(dashboard\)/tasks/_components/ReportTaskForm.tsx
```

- [ ] **Step 3: Typecheck (will fail in `ReportTaskPanel` — fixed in Task 16)**

```bash
yarn typecheck 2>&1 | grep -E "ReportTaskForm|ReportTaskPanel"
```
Expected: errors *only* in `ReportTaskPanel.tsx` (which references the deleted file) and in `SubmitReportButton.tsx`/`SubmitReportForm.tsx` if they import it. These are fixed in Tasks 16, 18.

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/tasks/_components/SubmitTaskForm.tsx
git add -u app/\(dashboard\)/tasks/_components/ReportTaskForm.tsx
git commit -m "feat(tasks): SubmitTaskForm with deliverable attachments"
```

---

## Task 14: `ReviewTaskForm`

**Files:**
- Create: `app/(dashboard)/tasks/_components/ReviewTaskForm.tsx`

- [ ] **Step 1: Create the form**

Create `app/(dashboard)/tasks/_components/ReviewTaskForm.tsx`:

```tsx
'use client';

import { useActionState, useEffect, useState } from 'react';
import { reviewTask } from '@/lib/actions/taskActions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Task } from '@/types';
import { CheckCircle2, MessageSquareWarning, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Decision = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

const OPTIONS: { value: Decision; label: string; description: string; icon: typeof CheckCircle2; tone: string }[] = [
  {
    value: 'APPROVE',
    label: 'Approve',
    description: 'Close the task as completed.',
    icon: CheckCircle2,
    tone: 'text-green-700 border-green-200 bg-green-50',
  },
  {
    value: 'REQUEST_CHANGES',
    label: 'Request changes',
    description: 'Send back for another round. Reason required.',
    icon: MessageSquareWarning,
    tone: 'text-amber-700 border-amber-200 bg-amber-50',
  },
  {
    value: 'REJECT',
    label: 'Reject',
    description: 'Terminal — task closes without completion. Reason required.',
    icon: XCircle,
    tone: 'text-red-700 border-red-200 bg-red-50',
  },
];

export function ReviewTaskForm({ task, onSuccess }: { task: Task; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(reviewTask, null);
  const [decision, setDecision] = useState<Decision>('APPROVE');

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const requiresNote = decision !== 'APPROVE';

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="decision" value={decision} />

      <div className="space-y-2">
        <Label>Decision *</Label>
        <div className="grid grid-cols-1 gap-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = decision === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDecision(opt.value)}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition',
                  active ? opt.tone : 'border-gray-200 bg-white hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-gray-600">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note {requiresNote ? '*' : '(optional)'}</Label>
        <Textarea
          id="note"
          name="note"
          required={requiresNote}
          placeholder={
            decision === 'APPROVE'
              ? 'Optional acknowledgement to the assignee.'
              : 'Be specific so the assignee knows what to change or why.'
          }
          className="h-24"
        />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Recording…' : `Submit decision: ${decision.replace('_', ' ')}`}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
yarn typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/tasks/_components/ReviewTaskForm.tsx
git commit -m "feat(tasks): ReviewTaskForm with Approve/Request changes/Reject"
```

---

## Task 15: `TaskDetailPanel` (replaces `ReportTaskPanel`)

**Files:**
- Create: `app/(dashboard)/tasks/_components/TaskDetailPanel.tsx`
- Create: `app/(dashboard)/tasks/_components/TaskActivityTimeline.tsx`
- Create: `app/(dashboard)/tasks/_components/TaskActionBar.tsx`
- Delete: `app/(dashboard)/tasks/_components/ReportTaskPanel.tsx`

- [ ] **Step 1: Create the timeline subcomponent**

Create `app/(dashboard)/tasks/_components/TaskActivityTimeline.tsx`:

```tsx
'use client';

import { Task, TaskActivityEntry } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  CircleDot,
  Edit3,
  FileText,
  MessageSquareWarning,
  Pause,
  Play,
  Send,
  XCircle,
} from 'lucide-react';

const ICONS: Record<TaskActivityEntry['type'], typeof CircleDot> = {
  CREATED: CircleDot,
  STARTED: Play,
  SUBMITTED: Send,
  APPROVED: CheckCircle2,
  CHANGES_REQUESTED: MessageSquareWarning,
  REJECTED: XCircle,
  BLOCKED: Pause,
  UNBLOCKED: Play,
  EDITED: Edit3,
};

const LABELS: Record<TaskActivityEntry['type'], string> = {
  CREATED: 'Created task',
  STARTED: 'Started work',
  SUBMITTED: 'Submitted report',
  APPROVED: 'Approved',
  CHANGES_REQUESTED: 'Requested changes',
  REJECTED: 'Rejected',
  BLOCKED: 'Blocked',
  UNBLOCKED: 'Unblocked',
  EDITED: 'Edited task',
};

export function TaskActivityTimeline({ task }: { task: Task }) {
  return (
    <ol className="space-y-4">
      {task.activity.map((entry) => {
        const Icon = ICONS[entry.type];
        return (
          <li key={entry.id} className="flex gap-3">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {LABELS[entry.type]} <span className="font-normal text-gray-500">· {entry.actorName}</span>
                </p>
                <p className="text-[11px] text-gray-500 shrink-0">{formatDate(entry.at)}</p>
              </div>

              {entry.note && <p className="text-sm text-gray-700 mt-1">{entry.note}</p>}

              {entry.type === 'SUBMITTED' && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {entry.progressMade && (
                    <div className="col-span-2">
                      <p className="text-gray-500 uppercase tracking-wide">Progress</p>
                      <p className="text-gray-800">{entry.progressMade}</p>
                    </div>
                  )}
                  {entry.percentageComplete != null && (
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide">Complete</p>
                      <p className="text-gray-800 font-semibold">{entry.percentageComplete}%</p>
                    </div>
                  )}
                  {entry.nextActions && (
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide">Next</p>
                      <p className="text-gray-800">{entry.nextActions}</p>
                    </div>
                  )}
                  {entry.blockers && (
                    <div className="col-span-2">
                      <p className="text-gray-500 uppercase tracking-wide">Blockers</p>
                      <p className="text-gray-800">{entry.blockers}</p>
                    </div>
                  )}
                </div>
              )}

              {entry.attachments && entry.attachments.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {entry.attachments.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a.url}
                        download={a.filename}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {a.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Create the action bar subcomponent**

Create `app/(dashboard)/tasks/_components/TaskActionBar.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { startTask, blockTask, unblockTask } from '@/lib/actions/taskActions';
import { toast } from 'sonner';
import { canStart, canSubmit, canReview, canBlock, canUnblock } from '@/lib/tasks/permissions';
import { Play, Pause, PlayCircle, Send, Gavel } from 'lucide-react';

interface Props {
  task: Task;
  currentUserId: string;
  onAction: (action: 'submit' | 'review') => void;
}

async function callAction(fn: typeof startTask, taskId: string, extras: Record<string, string> = {}) {
  const fdata = new FormData();
  fdata.append('taskId', taskId);
  Object.entries(extras).forEach(([k, v]) => fdata.append(k, v));
  return fn(null, fdata);
}

export function TaskActionBar({ task, currentUserId, onAction }: Props) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {canStart(task, currentUserId) && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await callAction(startTask, task.id);
              if (r.success) toast.success(r.message);
              else toast.error(r.message);
            })
          }
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          Start
        </Button>
      )}

      {canSubmit(task, currentUserId) && (
        <Button size="sm" onClick={() => onAction('submit')}>
          <Send className="w-3.5 h-3.5 mr-1" />
          {task.status === 'CHANGES_REQUESTED' ? 'Resubmit' : 'Submit'}
        </Button>
      )}

      {canReview(task, currentUserId) && (
        <Button size="sm" onClick={() => onAction('review')}>
          <Gavel className="w-3.5 h-3.5 mr-1" />
          Review
        </Button>
      )}

      {canBlock(task, currentUserId) && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const reason = window.prompt('Block reason (min 3 chars):');
              if (!reason || reason.trim().length < 3) return;
              const r = await callAction(blockTask, task.id, { reason });
              if (r.success) toast.success(r.message);
              else toast.error(r.message);
            })
          }
        >
          <Pause className="w-3.5 h-3.5 mr-1" />
          Block
        </Button>
      )}

      {canUnblock(task, currentUserId) && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await callAction(unblockTask, task.id);
              if (r.success) toast.success(r.message);
              else toast.error(r.message);
            })
          }
        >
          <PlayCircle className="w-3.5 h-3.5 mr-1" />
          Unblock
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the detail panel**

Create `app/(dashboard)/tasks/_components/TaskDetailPanel.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TaskActivityTimeline } from './TaskActivityTimeline';
import { TaskActionBar } from './TaskActionBar';
import { SubmitTaskForm } from './SubmitTaskForm';
import { ReviewTaskForm } from './ReviewTaskForm';
import { formatDate } from '@/lib/utils';
import { FileText, Calendar, User } from 'lucide-react';

type SubView = 'detail' | 'submit' | 'review';

interface Props {
  task: Task;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailPanel({ task, currentUserId, isOpen, onClose }: Props) {
  const [view, setView] = useState<SubView>('detail');

  const handleClose = () => {
    setView('detail');
    onClose();
  };

  return (
    <SlideInPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={view === 'submit' ? 'Submit Report' : view === 'review' ? 'Review Submission' : task.title}
      description={view === 'detail' ? `Assigned to ${task.assignedToNames.join(', ')}` : undefined}
    >
      {view === 'detail' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} variant="task" />
            <span className="text-xs text-gray-500">
              Priority: <span className="font-semibold">{task.priority}</span>
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.dueDate)}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              By {task.assignedByName}
            </span>
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>

          {task.referenceAttachments && task.referenceAttachments.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Reference materials</h4>
              <ul className="flex flex-wrap gap-2">
                {task.referenceAttachments.map((a, i) => (
                  <li key={i}>
                    <a
                      href={a.url}
                      download={a.filename}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {a.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <TaskActionBar
            task={task}
            currentUserId={currentUserId}
            onAction={(a) => setView(a === 'submit' ? 'submit' : 'review')}
          />

          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Activity</h4>
            <TaskActivityTimeline task={task} />
          </div>
        </div>
      )}

      {view === 'submit' && <SubmitTaskForm task={task} onSuccess={handleClose} />}
      {view === 'review' && <ReviewTaskForm task={task} onSuccess={handleClose} />}
    </SlideInPanel>
  );
}
```

- [ ] **Step 4: Delete the obsolete `ReportTaskPanel`**

```bash
rm app/\(dashboard\)/tasks/_components/ReportTaskPanel.tsx
```

- [ ] **Step 5: Typecheck**

```bash
yarn typecheck 2>&1 | grep -E "ReportTaskPanel|TaskDetailPanel"
```
Expected: errors *only* in callers of the deleted `ReportTaskPanel` (`TaskCard.tsx`, `TaskListView.tsx`) — fixed in Tasks 16 and 17.

- [ ] **Step 6: Commit**

```bash
git add app/\(dashboard\)/tasks/_components/TaskDetailPanel.tsx app/\(dashboard\)/tasks/_components/TaskActivityTimeline.tsx app/\(dashboard\)/tasks/_components/TaskActionBar.tsx
git add -u app/\(dashboard\)/tasks/_components/ReportTaskPanel.tsx
git commit -m "feat(tasks): TaskDetailPanel with timeline, action bar, submit/review modes"
```

---

## Task 16: `TaskCard` — badge + context action + opens detail panel

**Files:**
- Modify: `components/shared/TaskCard.tsx`

- [ ] **Step 1: Replace the component**

Replace the entire contents of `components/shared/TaskCard.tsx` with:

```tsx
'use client';

import { Task } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { AvatarCluster } from './AvatarCluster';
import { StatusBadge } from './StatusBadge';
import { Calendar, Paperclip, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const priorityColors = {
    LOW: 'bg-rose-100 text-rose-700 border-rose-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    HIGH: 'bg-blue-100 text-blue-700 border-blue-200',
    URGENT: 'bg-red-600 text-white border-red-700',
  } as const;

  const isPastDue =
    new Date(task.dueDate) < new Date() &&
    task.status !== 'COMPLETED' &&
    task.status !== 'REJECTED';

  const attachmentCount =
    (task.referenceAttachments?.length ?? 0) +
    task.activity.reduce((n, a) => n + (a.attachments?.length ?? 0), 0);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(task)}
      className={cn(
        'bg-white rounded-xl shadow-card p-4 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:shadow-card-hover',
        isDragging && 'opacity-50 shadow-elevated',
        task.priority === 'URGENT'
          ? 'hover:border-red-600'
          : task.priority === 'HIGH'
            ? 'hover:border-blue-600'
            : task.priority === 'MEDIUM'
              ? 'hover:border-amber-500'
              : 'hover:border-rose-500'
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider',
            priorityColors[task.priority]
          )}
        >
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} variant="task" />
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="font-urbanist font-semibold text-gray-900 text-lg leading-tight line-clamp-2 mb-1">
        {task.title}
      </h3>

      <p className="font-urbanist text-sm text-gray-500 line-clamp-3 mb-3">{task.description}</p>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 flex-wrap gap-2">
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            isPastDue ? 'text-red-600' : 'text-gray-500'
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(task.dueDate)}
        </div>

        <div className="flex items-center gap-2">
          {attachmentCount > 0 && (
            <span
              className="flex items-center gap-1 text-xs text-gray-500"
              title={`${attachmentCount} attachment(s)`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              {attachmentCount}
            </span>
          )}
          <AvatarCluster
            users={task.assignedToNames.map((name, i) => ({
              name,
              avatar: `https://i.pravatar.cc/150?u=${task.assignedToIds[i]}`,
            }))}
            size="sm"
          />
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
yarn typecheck 2>&1 | grep TaskCard
```
Expected: no errors from `TaskCard.tsx`. (Callers of `TaskCard` already pass `onClick`.)

- [ ] **Step 3: Commit**

```bash
git add components/shared/TaskCard.tsx
git commit -m "feat(tasks): TaskCard uses StatusBadge, surfaces attachments, opens detail"
```

---

## Task 17: `TaskCardGrid` and `TaskListView` open the detail panel

**Files:**
- Modify: `app/(dashboard)/tasks/_components/TaskCardGrid.tsx`
- Modify: `app/(dashboard)/tasks/_components/TaskListView.tsx`

- [ ] **Step 1: Update `TaskCardGrid` to manage the open task**

Replace `app/(dashboard)/tasks/_components/TaskCardGrid.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { TaskDetailPanel } from './TaskDetailPanel';
import { motion } from 'motion/react';
import { ClipboardList } from 'lucide-react';

interface TaskCardGridProps {
  initialTasks: Task[];
  currentUserId: string;
}

export function TaskCardGrid({ initialTasks, currentUserId }: TaskCardGridProps) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const openTask = openTaskId ? initialTasks.find((t) => t.id === openTaskId) : null;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {initialTasks.map((task) => (
          <motion.div key={task.id} variants={item}>
            <TaskCard task={task} onClick={(t) => setOpenTaskId(t.id)} />
          </motion.div>
        ))}

        {initialTasks.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-primary-muted flex items-center justify-center text-primary mb-4">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Nothing here</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              No tasks match this view yet. Create one to get started.
            </p>
          </div>
        )}
      </motion.div>

      {openTask && (
        <TaskDetailPanel
          task={openTask}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={() => setOpenTaskId(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Update `TaskListView` to open the detail panel**

Replace `app/(dashboard)/tasks/_components/TaskListView.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Task } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TaskDetailPanel } from './TaskDetailPanel';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export function TaskListView({
  initialTasks,
  currentUserId,
}: {
  initialTasks: Task[];
  currentUserId: string;
}) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const openTask = openTaskId ? initialTasks.find((t) => t.id === openTaskId) : null;

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'title',
      header: 'Task',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.title}</div>
          <div className="text-gray-500 text-xs truncate max-w-xs">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} variant="task" />,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <span
          className={
            row.original.priority === 'URGENT'
              ? 'text-xs font-semibold text-red-600'
              : row.original.priority === 'HIGH'
                ? 'text-xs font-semibold text-orange-500'
                : row.original.priority === 'MEDIUM'
                  ? 'text-xs font-semibold text-blue-500'
                  : 'text-xs font-semibold text-gray-500'
          }
        >
          {row.original.priority}
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due',
      cell: ({ row }) => (
        <span className="text-gray-600">{new Date(row.original.dueDate).toLocaleDateString()}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end pr-2">
          <Button size="sm" variant="outline" onClick={() => setOpenTaskId(row.original.id)}>
            <Eye className="w-3.5 h-3.5 mr-1" />
            Open
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="pt-2">
      <DataTable
        columns={columns}
        data={initialTasks}
        searchKey="title"
        emptyMessage="No tasks found matching this criteria."
      />
      {openTask && (
        <TaskDetailPanel
          task={openTask}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={() => setOpenTaskId(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
yarn typecheck 2>&1 | grep -E "TaskCardGrid|TaskListView"
```
Expected: errors only in `app/(dashboard)/tasks/page.tsx` (missing `currentUserId` prop) — fixed in Task 19.

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/tasks/_components/TaskCardGrid.tsx app/\(dashboard\)/tasks/_components/TaskListView.tsx
git commit -m "feat(tasks): grid and list views open TaskDetailPanel on click"
```

---

## Task 18: `TaskKanban` — new columns + permission-checked drag

**Files:**
- Modify: `app/(dashboard)/tasks/_components/TaskKanban.tsx`

- [ ] **Step 1: Replace the kanban**

Replace the entire contents of `app/(dashboard)/tasks/_components/TaskKanban.tsx` with:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { TaskDetailPanel } from './TaskDetailPanel';
import { startTask, blockTask, unblockTask } from '@/lib/actions/taskActions';
import { canStart, canBlock, canUnblock } from '@/lib/tasks/permissions';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-50' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'SUBMITTED', title: 'Submitted', color: 'bg-purple-50' },
  { id: 'CHANGES_REQUESTED', title: 'Changes Requested', color: 'bg-amber-50' },
  { id: 'BLOCKED', title: 'Blocked', color: 'bg-red-50' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-green-50' },
];

function SortableTask({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

interface TaskKanbanProps {
  initialTasks: Task[];
  currentUserId: string;
}

export function TaskKanban({ initialTasks, currentUserId }: TaskKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [, startMutation] = useTransition();

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const t = tasks.find((x) => x.id === e.active.id);
    if (t) setActiveTask(t);
  };

  const runAction = async (fn: typeof startTask, taskId: string, extras: Record<string, string> = {}) => {
    const f = new FormData();
    f.append('taskId', taskId);
    Object.entries(extras).forEach(([k, v]) => f.append(k, v));
    return fn(null, f);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const overId = over.id as TaskStatus | string;
    const targetCol = COLUMNS.find((c) => c.id === overId);
    if (!targetCol) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === targetCol.id) return;

    let allowed = false;
    let mutator: (() => Promise<{ success: boolean; message: string }>) | null = null;

    if (targetCol.id === 'IN_PROGRESS') {
      if (task.status === 'TODO' || task.status === 'CHANGES_REQUESTED') {
        allowed = canStart(task, currentUserId);
        mutator = () => runAction(startTask, task.id);
      } else if (task.status === 'BLOCKED') {
        allowed = canUnblock(task, currentUserId);
        mutator = () => runAction(unblockTask, task.id);
      }
    } else if (targetCol.id === 'BLOCKED') {
      allowed = canBlock(task, currentUserId);
      if (allowed) {
        const reason = window.prompt('Block reason (min 3 chars):');
        if (!reason || reason.trim().length < 3) {
          toast.error('Block cancelled.');
          return;
        }
        mutator = () => runAction(blockTask, task.id, { reason });
      }
    }

    if (!allowed || !mutator) {
      toast.error('That move is not allowed from the kanban — open the task to act on it.');
      return;
    }

    startMutation(async () => {
      const r = await mutator!();
      if (r.success) toast.success(r.message);
      else toast.error(r.message);
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} id={col.id} className={cn('flex-1 min-w-[280px] rounded-xl p-4', col.color)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-urbanist font-bold text-gray-900">{col.title}</h3>
                <span className="bg-white text-gray-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  {colTasks.length}
                </span>
              </div>
              <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[200px]">
                  {colTasks.map((task) => (
                    <SortableTask key={task.id} task={task} onClick={(t) => setOpenTaskId(t.id)} />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} onClick={() => {}} isDragging /> : null}</DragOverlay>

      {openTask && (
        <TaskDetailPanel task={openTask} currentUserId={currentUserId} isOpen={true} onClose={() => setOpenTaskId(null)} />
      )}
    </DndContext>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
yarn typecheck 2>&1 | grep TaskKanban
```
Expected: no errors from `TaskKanban.tsx`. (Errors in `page.tsx` for the new prop — Task 19.)

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/tasks/_components/TaskKanban.tsx
git commit -m "feat(tasks): kanban supports new statuses and permission-checked drag"
```

---

## Task 19: `MyDayStrip` and `QuickPersonalTaskInput`

**Files:**
- Create: `app/(dashboard)/tasks/_components/MyDayStrip.tsx`
- Create: `app/(dashboard)/tasks/_components/QuickPersonalTaskInput.tsx`

- [ ] **Step 1: Create `MyDayStrip`**

Create `app/(dashboard)/tasks/_components/MyDayStrip.tsx`:

```tsx
import Link from 'next/link';
import { Task } from '@/types';
import { binFor, DayBin } from '@/lib/tasks/permissions';
import { CheckCircle2, FileSearch, CalendarClock, AlertOctagon, Pause, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TILES: { bin: DayBin; label: string; icon: typeof CheckCircle2; tone: string }[] = [
  { bin: 'needs-submit', label: 'Needs my submission', icon: CheckCircle2, tone: 'text-blue-700 bg-blue-50' },
  { bin: 'awaiting-review', label: 'Awaiting my review', icon: FileSearch, tone: 'text-purple-700 bg-purple-50' },
  { bin: 'due-today', label: 'Due today', icon: CalendarClock, tone: 'text-amber-700 bg-amber-50' },
  { bin: 'overdue', label: 'Overdue', icon: AlertOctagon, tone: 'text-red-700 bg-red-50' },
  { bin: 'blocked', label: 'Blocked', icon: Pause, tone: 'text-rose-700 bg-rose-50' },
];

export function MyDayStrip({
  tasks,
  userId,
  activeFilter,
  view,
}: {
  tasks: Task[];
  userId: string;
  activeFilter?: string;
  view: string;
}) {
  const now = new Date();
  const counts: Record<DayBin, number> = {
    'needs-submit': 0,
    'awaiting-review': 0,
    'due-today': 0,
    overdue: 0,
    blocked: 0,
  };
  for (const t of tasks) {
    const b = binFor(t, userId, now);
    if (b) counts[b] += 1;
  }

  const allClear = counts['needs-submit'] === 0 && counts['awaiting-review'] === 0 && counts.overdue === 0;

  return (
    <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {TILES.map(({ bin, label, icon: Icon, tone }) => {
          const active = activeFilter === bin;
          return (
            <Link
              key={bin}
              href={`/tasks?view=${view}&filter=${bin}`}
              scroll={false}
              className={cn(
                'rounded-lg border p-3 flex items-center gap-3 transition',
                active ? 'border-primary ring-2 ring-primary/20 bg-primary-muted/40' : 'border-gray-100 hover:bg-gray-50'
              )}
            >
              <span className={cn('w-10 h-10 rounded-md flex items-center justify-center shrink-0', tone)}>
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={cn('text-2xl font-bold leading-none', counts[bin] === 0 ? 'text-gray-300' : 'text-gray-900')}>
                  {counts[bin]}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {allClear && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
          <Sparkles className="w-4 h-4" />
          You're all clear. Nice work. New tasks will surface here as they come in.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `QuickPersonalTaskInput`**

Create `app/(dashboard)/tasks/_components/QuickPersonalTaskInput.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { addTask } from '@/lib/actions/taskActions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

export function QuickPersonalTaskInput() {
  const [title, setTitle] = useState('');
  const [pending, start] = useTransition();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 5) {
      toast.error('Title must be at least 5 characters.');
      return;
    }
    start(async () => {
      const dueDate = new Date();
      dueDate.setHours(17, 0, 0, 0);
      const f = new FormData();
      f.append('title', trimmed);
      f.append('description', 'Quick personal task added from My Day.');
      f.append('priority', 'MEDIUM');
      f.append('dueDate', dueDate.toISOString().slice(0, 10));
      const r = await addTask(null, f);
      if (r.success) {
        setTitle('');
        toast.success('Personal task added.');
      } else {
        toast.error(r.message);
      }
    });
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative">
        <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick personal task…"
          className="pl-7 w-64"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? 'Adding…' : 'Add'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
yarn typecheck 2>&1 | grep -E "MyDayStrip|QuickPersonalTaskInput"
```
Expected: no errors from these files.

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/tasks/_components/MyDayStrip.tsx app/\(dashboard\)/tasks/_components/QuickPersonalTaskInput.tsx
git commit -m "feat(tasks): MyDayStrip with bin tiles + QuickPersonalTaskInput"
```

---

## Task 20: Page wiring — `/tasks` page with new filters, Personal tab, and strip

**Files:**
- Modify: `app/(dashboard)/tasks/page.tsx`
- Delete: `app/(dashboard)/tasks/_components/SubmitReportButton.tsx`
- Delete: `app/(dashboard)/tasks/_components/SubmitReportForm.tsx`

- [ ] **Step 1: Replace the page**

Replace `app/(dashboard)/tasks/page.tsx` with:

```tsx
import { PageHeader } from '@/components/shared/PageHeader';
import { mockTasks } from '@/lib/mock/mockTasks';
import { binFor } from '@/lib/tasks/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateTaskButton } from './_components/CreateTaskButton';
import { QuickPersonalTaskInput } from './_components/QuickPersonalTaskInput';
import { MyDayStrip } from './_components/MyDayStrip';
import { TaskCardGrid } from './_components/TaskCardGrid';
import { TaskKanban } from './_components/TaskKanban';
import { TaskListView } from './_components/TaskListView';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

type Filter =
  | 'my-tasks'
  | 'assigned-by-me'
  | 'department'
  | 'personal'
  | 'needs-submit'
  | 'awaiting-review'
  | 'due-today'
  | 'overdue'
  | 'blocked';

const TABS: { value: Filter; label: string }[] = [
  { value: 'my-tasks', label: 'My Tasks' },
  { value: 'assigned-by-me', label: 'Assigned by Me' },
  { value: 'department', label: 'Department' },
  { value: 'personal', label: 'Personal' },
];

function applyFilter(tasks: Task[], filter: Filter, session: { userId: string; department: string }): Task[] {
  const now = new Date();
  switch (filter) {
    case 'my-tasks':
      return tasks.filter((t) => t.assignedToIds.includes(session.userId));
    case 'assigned-by-me':
      return tasks.filter((t) => t.assignedById === session.userId);
    case 'department':
      return tasks.filter((t) => t.department === session.department);
    case 'personal':
      return tasks.filter((t) => t.isPersonal && t.assignedToIds.includes(session.userId));
    case 'needs-submit':
    case 'awaiting-review':
    case 'due-today':
    case 'overdue':
    case 'blocked':
      return tasks.filter((t) => binFor(t, session.userId, now) === filter);
  }
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value);
  const sp = await searchParams;

  const view = sp.view ?? 'grid';
  const filter = (sp.filter ?? 'my-tasks') as Filter;
  const displayed = applyFilter(mockTasks, filter, session);

  const isBinFilter = ['needs-submit', 'awaiting-review', 'due-today', 'overdue', 'blocked'].includes(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`My Day · ${formatToday()}`}
        description="What needs your attention today."
        actions={
          <div className="flex items-center gap-3">
            <QuickPersonalTaskInput />
            <CreateTaskButton currentUserId={session.userId} />
          </div>
        }
      />

      <MyDayStrip
        tasks={mockTasks}
        userId={session.userId}
        activeFilter={isBinFilter ? filter : undefined}
        view={view}
      />

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="flex gap-6 flex-wrap">
            {TABS.map((tab) => (
              <Link
                key={tab.value}
                href={`?view=${view}&filter=${tab.value}`}
                scroll={false}
                className={cn(
                  'pb-4 -mb-[17px] font-medium transition-colors',
                  filter === tab.value
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-2">
            {(['grid', 'board', 'list'] as const).map((v) => (
              <Link
                key={v}
                href={`?view=${v}&filter=${filter}`}
                scroll={false}
                className={cn(
                  'p-2 rounded transition-colors capitalize',
                  view === v ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'
                )}
              >
                {v}
              </Link>
            ))}
          </div>
        </div>

        {view === 'grid' && <TaskCardGrid initialTasks={displayed} currentUserId={session.userId} />}
        {view === 'board' && <TaskKanban initialTasks={displayed} currentUserId={session.userId} />}
        {view === 'list' && <TaskListView initialTasks={displayed} currentUserId={session.userId} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete the obsolete top-level Submit Report entry point**

```bash
rm app/\(dashboard\)/tasks/_components/SubmitReportButton.tsx
rm app/\(dashboard\)/tasks/_components/SubmitReportForm.tsx
```
(The detail panel now hosts submission per-task, which is the intended model.)

- [ ] **Step 3: Typecheck — should now be clean**

```bash
yarn typecheck
```
Expected: zero errors.

- [ ] **Step 4: Run all tests**

```bash
yarn test
```
Expected: PASS — all suites green (existing pipeline tests + new permissions + taskActions).

- [ ] **Step 5: Commit**

```bash
git add app/\(dashboard\)/tasks/page.tsx
git add -u app/\(dashboard\)/tasks/_components/SubmitReportButton.tsx app/\(dashboard\)/tasks/_components/SubmitReportForm.tsx
git commit -m "feat(tasks): wire My Day strip, Personal tab, bin filters, new title"
```

---

## Task 21: Manual verification

**Files:** none (verification + final commit if any fixes)

- [ ] **Step 1: Start the dev server**

```bash
yarn dev
```
Wait for `Local: http://localhost:3000` in the output.

- [ ] **Step 2: Walk through every flow in a browser**

In a separate terminal/window, open `http://localhost:3000/login`, sign in as `md@ypit.com` / `ypit2026`, then:

1. **Personal task end-to-end**
   - Header → type "Tidy my email inbox" into Quick Personal Task → Add. Toast confirms.
   - Click **Personal** tab. New card appears with priority MEDIUM, status TODO, due today.
   - Click the card. `TaskDetailPanel` opens. **Start** → status flips to IN_PROGRESS.
   - **Submit** → fill summary + progress + 100% → Mark Complete. Status flips to COMPLETED.
   - Activity timeline shows CREATED → STARTED → SUBMITTED.
2. **Assigned task with reference + review cycle**
   - Header → **Create Task** → fill title, description, priority HIGH, due tomorrow, assignee `Sarah Kimani`, tag `Marketing, Q2`, attach a PNG file via Reference materials → Assign Task.
   - Toast confirms. Log out, log back in as `mm@ypit.com` / `ypit2026` (Sarah).
   - **My Day** strip shows "Needs my submission" at least 1. Click the tile → grid filters.
   - Open the new task. Reference materials chip visible and downloadable. **Start** → **Submit** with summary + progress + a deliverable file → Submit for review.
   - Log out, back in as MD. **Awaiting my review** tile is ≥ 1. Open task → **Review** → Request changes with note "Add a budget table".
   - Log out, back in as Sarah. Status `CHANGES REQUESTED` on the card. Open → **Resubmit** with updated report → submitted again (round 2 in timeline).
   - Back as MD → **Review** → Approve. Status flips to COMPLETED. Activity timeline shows both rounds.
3. **Reject path** — Repeat steps from #2 up to first submit, then MD rejects with reason → status REJECTED → does not appear in non-rejected bin filters; appears greyed in `My Tasks` tab.
4. **Block / unblock**
   - On an IN_PROGRESS task, click **Block** → enter reason → status BLOCKED, appears in Blocked tile and Blocked kanban column.
   - Drag from Blocked → In Progress on kanban → toast confirms.
5. **Permission guardrails**
   - As a non-assignee, try to drag someone else's task between columns → toast warning "That move is not allowed from the kanban".
6. **Empty state**
   - Navigate to `?filter=overdue&view=grid` when overdue is 0 → "Nothing here" empty card visible.
7. **Console & network** — DevTools console should show zero red errors across all flows.

- [ ] **Step 3: If any flow fails, fix and commit before completing**

If a manual verification step reveals a regression, fix in a focused commit:
```bash
git add <files>
git commit -m "fix(tasks): <what>"
```
Then re-run that flow.

- [ ] **Step 4: Final sanity check**

```bash
yarn typecheck && yarn test && yarn lint
```
Expected: all three green.

- [ ] **Step 5: Final commit (only if there are unstaged changes left)**

```bash
git status
```

If `git status` reports any modified/untracked files relevant to the verification (e.g. minor copy fixes), stage and commit them:

```bash
git add <specific files>
git commit -m "chore(tasks): tidy after verification"
```

If `git status` is clean, skip this step.

---

## Done

Branch is ready for review / PR. The `/tasks` page now functions as a daily-ops entry point with:

- My Day strip (Needs my submission · Awaiting my review · Due today · Overdue · Blocked).
- Personal tasks (self-assign or omit assignee → close on submit).
- Reference + deliverable attachments (up to 5 files each).
- Strict review gate: SUBMITTED → Approve / Request changes / Reject.
- Activity timeline with structured rounds.
- Permission-checked kanban drag.
- Notifications + audit logs for every state change.
