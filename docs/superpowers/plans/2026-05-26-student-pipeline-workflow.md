# Student Pipeline Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a centralized stage-transition engine for the 9-stage student pipeline, with owner-based handoffs, gated triggers, simulated WhatsApp notifications to student + guardians, role queues, and a 4-step travel sub-pipeline.

**Architecture:** A single declarative transition table (`lib/pipeline/transitions.ts`) defines every valid stage move (allowed roles, required fields, notification recipients, message template). One server action `advanceStudent` consults the table. A generic `<AdvanceStageModal>` renders the right form per transition. Travel sub-steps run on a parallel smaller table. Notifications are simulated via `Notification` records + sonner toasts; the WhatsApp send seam is `sendSimulated()` and can be swapped for a real provider later.

**Tech Stack:** Next.js 15 (App Router, Server Actions), React 19, TypeScript 5.9, Tailwind 4, shadcn/ui (Radix Dialog, etc.), Zod, sonner. **Vitest 2.x** added in Task 1 for the first time in this repo.

**Spec:** [docs/superpowers/specs/2026-05-26-student-pipeline-workflow-design.md](../specs/2026-05-26-student-pipeline-workflow-design.md)

**Testing approach:**
- **Pure logic (transition table, notification routing, action core):** strict TDD with Vitest.
- **UI components:** typecheck + lint + manual dev-server verification (no component test framework added - out of scope for a mock-data prototype).
- After every task: `npm run typecheck && npm run lint && npm test` (`npm test` once Vitest is installed in Task 1).

---

## Phase A - Foundation

### Task 1: Add Vitest test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/pipeline/__sanity__.test.ts`

- [ ] **Step 1: Install Vitest as a dev dependency**

```bash
npm install --save-dev vitest@^2.1.0 @vitest/coverage-v8@^2.1.0
```

Expected: package added to `devDependencies`; no peer-dep warnings.

- [ ] **Step 2: Add `test` script to `package.json`**

Edit the `scripts` block (current state ends with `"clean": "next clean"`). Add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Final scripts block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "clean": "next clean",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create `vitest.config.ts` at project root**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 4: Write a sanity test**

Create `lib/pipeline/__sanity__.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the sanity test**

```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/pipeline/__sanity__.test.ts
git commit -m "chore(test): add Vitest for pipeline engine tests"
```

---

### Task 2: Add type definitions (Guardian, StageTransition, Student/TravelRecord/Notification additions)

**Files:**
- Modify: `types/index.ts` (append new types; modify `Student`, `TravelRecord`, `Notification`)

- [ ] **Step 1: Add Guardian types at the end of `types/index.ts`**

Append:

```ts
// ============================================================
// PIPELINE WORKFLOW
// ============================================================

export type GuardianRelation = 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'SPONSOR' | 'OTHER';

export interface Guardian {
  id: string;
  studentId: string;
  fullName: string;
  relation: GuardianRelation;
  phone: string;
  whatsapp?: string;
  email?: string;
  isPrimary: boolean;
  createdAt: string;
}

export type StageTransitionPayload = Record<string, string | number | boolean | null>;

export interface StageTransition {
  id: string;
  studentId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  triggeredById: string;
  triggeredByName: string;
  triggeredByRole: Role;
  capturedData: StageTransitionPayload;
  notificationsSent: string[];
  notes?: string;
  createdAt: string;
}

export type TravelSubStep = 'passport' | 'visa' | 'flight' | 'arrival';
export type TravelSubStepStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export interface TravelStepStatusMap {
  passport: TravelSubStepStatus;
  visa: TravelSubStepStatus;
  flight: TravelSubStepStatus;
  arrival: TravelSubStepStatus;
}

export type NotifyAudience = 'STUDENT' | 'PARENT_PRIMARY' | 'ALL_PARENTS' | 'NEW_OWNER' | 'TEAM';
export type NotifyChannel = 'WHATSAPP' | 'IN_APP';
```

- [ ] **Step 2: Modify the `Student` interface - add 2 new fields**

Find the `Student` interface (currently ends with `notes?: string;`). Add immediately before the closing `}`:

```ts
  stageOwnerId?: string;
  stageEnteredAt?: string;  // ISO; populated by advanceStudent / backfilled to createdAt for existing students
```

- [ ] **Step 3: Modify the `TravelRecord` interface - add `travelStepStatus` field**

Find the `TravelRecord` interface (currently ends with `updatedAt: string;`). Add immediately before the closing `}`:

```ts
  travelStepStatus?: TravelStepStatusMap;
```

(Optional because existing mock records won't have it on first load; helpers will treat undefined as `NOT_STARTED` for each step.)

- [ ] **Step 4: Modify the `Notification` interface - add 5 new fields**

Find the `Notification` interface (currently ends with `createdAt: string;`). Add immediately before the closing `}`:

```ts
  audience?: NotifyAudience;
  channel?: NotifyChannel;
  messageBody?: string;
  recipientName?: string;
  recipientPhone?: string;
  simulated?: boolean;
```

All optional so existing `Notification` literals in mock data still type-check.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add Guardian, StageTransition, travel sub-step types

Adds Student.stageOwnerId/stageEnteredAt, TravelRecord.travelStepStatus,
and Notification audience/channel/messageBody fields for the simulated
WhatsApp send pipeline."
```

---

### Task 3: Create mock-data stores for Guardian and StageTransition

**Files:**
- Create: `lib/mock/mockGuardians.ts`
- Create: `lib/mock/mockStageTransitions.ts`

- [ ] **Step 1: Create `lib/mock/mockGuardians.ts`**

```ts
import { Guardian } from '@/types';

export const mockGuardians: Guardian[] = [
  {
    id: 'gdn_001',
    studentId: 'std_001',
    fullName: 'Mary Doe',
    relation: 'MOTHER',
    phone: '+255712000001',
    whatsapp: '+255712000001',
    email: 'mary.doe@example.com',
    isPrimary: true,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'gdn_002',
    studentId: 'std_001',
    fullName: 'James Doe',
    relation: 'FATHER',
    phone: '+255712000002',
    isPrimary: false,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'gdn_003',
    studentId: 'std_007',
    fullName: 'Victoria Beckham',
    relation: 'MOTHER',
    phone: '+255712000007',
    whatsapp: '+255712000007',
    isPrimary: true,
    createdAt: '2026-01-15T00:00:00Z',
  },
];

export function getGuardiansForStudent(studentId: string): Guardian[] {
  return mockGuardians.filter(g => g.studentId === studentId);
}

export function getPrimaryGuardian(studentId: string): Guardian | undefined {
  return mockGuardians.find(g => g.studentId === studentId && g.isPrimary);
}
```

- [ ] **Step 2: Create `lib/mock/mockStageTransitions.ts`**

```ts
import { StageTransition } from '@/types';

export const mockStageTransitions: StageTransition[] = [];

export function getTransitionsForStudent(studentId: string): StageTransition[] {
  return mockStageTransitions
    .filter(t => t.studentId === studentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/mock/mockGuardians.ts lib/mock/mockStageTransitions.ts
git commit -m "feat(mock): add Guardian and StageTransition stores"
```

---

### Task 4: Backfill `stageEnteredAt` and add owner helpers

**Files:**
- Modify: `lib/mock/mockStudents.ts` (add `stageEnteredAt` to each student - set to `createdAt`)
- Create: `lib/pipeline/stageOwnership.ts`

- [ ] **Step 1: Backfill `stageEnteredAt` for existing mock students**

For every student in `lib/mock/mockStudents.ts`, add `stageEnteredAt: <the existing createdAt value>,` as a new field on the object literal. Example for the first record:

```ts
{
  id: "std_001",
  // ... existing fields ...
  createdAt: "2026-01-10T00:00:00Z",
  updatedAt: "2026-01-15T00:00:00Z",
  stageEnteredAt: "2026-01-10T00:00:00Z",
  notes: "Interested in UK universities."
},
```

Do this for **every** student object in the file.

- [ ] **Step 2: Create `lib/pipeline/stageOwnership.ts`**

```ts
import { PipelineStage, Role, ROLES } from '@/types';

/**
 * For each pipeline stage, the roles that "own" that stage -
 * meaning: the student appears in their MyQueue, and they have
 * the right to advance the student to the next stage.
 *
 * Source of truth: spec section 11 (Role → Stage Ownership).
 */
export const STAGE_OWNERS: Record<PipelineStage, Role[]> = {
  LEAD: [ROLES.MARKETING_STAFF, ROLES.SUB_AGENT],
  COUNSELING: [ROLES.MARKETING_STAFF, ROLES.MARKETING_MANAGER],
  PAYMENT_PENDING: [ROLES.FINANCE],
  PAYMENT_CONFIRMED: [ROLES.ADMISSIONS],
  APPLICATION_SUBMITTED: [ROLES.ADMISSIONS],
  UNIVERSITY_ACCEPTED: [ROLES.TRAVEL],
  TRAVEL_PLANNING: [ROLES.TRAVEL],
  TRAVELLED: [ROLES.OPERATIONS],
  MONITORING: [ROLES.OPERATIONS],
};

export function getStageOwners(stage: PipelineStage): Role[] {
  return STAGE_OWNERS[stage] ?? [];
}

export function isStageOwner(role: Role, stage: PipelineStage): boolean {
  return getStageOwners(stage).includes(role);
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/mock/mockStudents.ts lib/pipeline/stageOwnership.ts
git commit -m "feat(pipeline): add stage-ownership helper and backfill stageEnteredAt

Establishes which roles own each pipeline stage (spec section 11)
and backfills stageEnteredAt for existing mock students so the
new MyQueue 'days waiting' calculation works out of the box."
```

---

## Phase B - Pure pipeline logic (TDD)

### Task 5: Field-spec types

**Files:**
- Create: `lib/pipeline/fields.ts`

(No test file - these are pure type defs with no behavior.)

- [ ] **Step 1: Create `lib/pipeline/fields.ts`**

```ts
import { Role } from '@/types';

export type FieldSpecKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'boolean'
  | 'url'
  | 'select'
  | 'userSelect'        // shows users filtered by role
  | 'paymentMethodSelect';

export interface BaseFieldSpec {
  key: string;
  label: string;
  required: boolean;
  helpText?: string;
}

export type FieldSpec =
  | (BaseFieldSpec & { kind: 'text' | 'textarea' | 'date' | 'url' })
  | (BaseFieldSpec & { kind: 'number'; min?: number; currency?: string })
  | (BaseFieldSpec & { kind: 'boolean'; defaultValue?: boolean })
  | (BaseFieldSpec & { kind: 'select'; options: { value: string; label: string }[] })
  | (BaseFieldSpec & { kind: 'userSelect'; roles: Role[] })
  | (BaseFieldSpec & { kind: 'paymentMethodSelect' });
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/pipeline/fields.ts
git commit -m "feat(pipeline): add FieldSpec discriminated union for transition modals"
```

---

### Task 6: Notification recipient resolution (TDD)

**Files:**
- Create: `lib/pipeline/notify.ts`
- Create: `lib/pipeline/notify.test.ts`
- Reads: `lib/mock/mockGuardians.ts`, `lib/mock/mockStudents.ts`, `lib/mock/mockUsers.ts`, `lib/mock/mockNotifications.ts` (may need to verify the last exists; if not, create as empty)

- [ ] **Step 1: Check if `lib/mock/mockNotifications.ts` exists; if not, create it**

```bash
ls lib/mock/mockNotifications.ts 2>/dev/null || echo "needs creating"
```

If "needs creating":

```ts
// lib/mock/mockNotifications.ts
import { Notification } from '@/types';

export const mockNotifications: Notification[] = [];
```

- [ ] **Step 2: Write failing tests for recipient resolution**

Create `lib/pipeline/notify.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveRecipients } from './notify';
import { mockStudents } from '@/lib/mock/mockStudents';
import { mockGuardians } from '@/lib/mock/mockGuardians';

describe('resolveRecipients', () => {
  beforeEach(() => {
    // Tests assume mock data shipped in Task 3 (std_001 has 2 guardians, one primary)
  });

  it('STUDENT audience returns the student with their WhatsApp number', () => {
    const recipients = resolveRecipients({
      audience: 'STUDENT',
      studentId: 'std_001',
      newOwnerRole: 'FINANCE',
    });
    expect(recipients).toHaveLength(1);
    expect(recipients[0]).toMatchObject({
      kind: 'WHATSAPP',
      name: 'John Doe',
      phone: '+255712345678',
    });
  });

  it('PARENT_PRIMARY returns the guardian marked isPrimary', () => {
    const recipients = resolveRecipients({
      audience: 'PARENT_PRIMARY',
      studentId: 'std_001',
      newOwnerRole: 'FINANCE',
    });
    expect(recipients).toHaveLength(1);
    expect(recipients[0]).toMatchObject({
      kind: 'WHATSAPP',
      name: 'Mary Doe',
    });
  });

  it('ALL_PARENTS returns every guardian', () => {
    const recipients = resolveRecipients({
      audience: 'ALL_PARENTS',
      studentId: 'std_001',
      newOwnerRole: 'FINANCE',
    });
    expect(recipients).toHaveLength(2);
    expect(recipients.map(r => r.name).sort()).toEqual(['James Doe', 'Mary Doe']);
  });

  it('returns empty for PARENT_PRIMARY when student has no guardians', () => {
    const recipients = resolveRecipients({
      audience: 'PARENT_PRIMARY',
      studentId: 'std_999_nonexistent',
      newOwnerRole: 'FINANCE',
    });
    expect(recipients).toEqual([]);
  });

  it('NEW_OWNER returns in-app recipients for every user in newOwnerRole', () => {
    const recipients = resolveRecipients({
      audience: 'NEW_OWNER',
      studentId: 'std_001',
      newOwnerRole: 'FINANCE',
    });
    expect(recipients.length).toBeGreaterThan(0);
    expect(recipients.every(r => r.kind === 'IN_APP')).toBe(true);
  });

  it('returns empty for STUDENT audience when student does not exist', () => {
    const recipients = resolveRecipients({
      audience: 'STUDENT',
      studentId: 'std_does_not_exist',
      newOwnerRole: 'FINANCE',
    });
    expect(recipients).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests - expect all to FAIL**

```bash
npm test
```

Expected: 6 tests fail (`resolveRecipients` not defined).

- [ ] **Step 4: Implement `resolveRecipients` and `sendSimulated` in `lib/pipeline/notify.ts`**

```ts
import { Notification, NotifyAudience, NotifyChannel, Role } from '@/types';
import { mockStudents } from '@/lib/mock/mockStudents';
import { mockGuardians } from '@/lib/mock/mockGuardians';
import { mockUsers } from '@/lib/mock/mockUsers';
import { mockNotifications } from '@/lib/mock/mockNotifications';

export interface ResolvedRecipient {
  kind: NotifyChannel;
  userId?: string;        // set when kind === 'IN_APP'
  name: string;
  phone?: string;          // set when kind === 'WHATSAPP'
}

export interface ResolveRecipientsInput {
  audience: NotifyAudience;
  studentId: string;
  newOwnerRole: Role;
  newOwnerId?: string;     // if already assigned, target only this user
}

export function resolveRecipients(input: ResolveRecipientsInput): ResolvedRecipient[] {
  const { audience, studentId, newOwnerRole, newOwnerId } = input;

  switch (audience) {
    case 'STUDENT': {
      const student = mockStudents.find(s => s.id === studentId);
      if (!student) return [];
      return [{
        kind: 'WHATSAPP',
        name: student.fullName,
        phone: student.whatsapp ?? student.phone,
      }];
    }
    case 'PARENT_PRIMARY': {
      const primary = mockGuardians.find(g => g.studentId === studentId && g.isPrimary);
      if (!primary) return [];
      return [{
        kind: 'WHATSAPP',
        name: primary.fullName,
        phone: primary.whatsapp ?? primary.phone,
      }];
    }
    case 'ALL_PARENTS': {
      return mockGuardians
        .filter(g => g.studentId === studentId)
        .map(g => ({
          kind: 'WHATSAPP' as const,
          name: g.fullName,
          phone: g.whatsapp ?? g.phone,
        }));
    }
    case 'NEW_OWNER': {
      const targets = newOwnerId
        ? mockUsers.filter(u => u.id === newOwnerId)
        : mockUsers.filter(u => u.role === newOwnerRole && u.status === 'ACTIVE');
      return targets.map(u => ({
        kind: 'IN_APP' as const,
        userId: u.id,
        name: u.fullName,
      }));
    }
    case 'TEAM': {
      return mockUsers
        .filter(u => u.role === newOwnerRole && u.status === 'ACTIVE')
        .map(u => ({
          kind: 'IN_APP' as const,
          userId: u.id,
          name: u.fullName,
        }));
    }
    default:
      return [];
  }
}

export interface SendSimulatedInput {
  studentId: string;
  audience: NotifyAudience;
  newOwnerRole: Role;
  newOwnerId?: string;
  title: string;
  messageBody: string;     // already rendered template
  link?: string;
}

/**
 * Creates Notification records (one per resolved recipient) and pushes them
 * into the mock store. Returns the IDs created.
 */
export function sendSimulated(input: SendSimulatedInput): string[] {
  const recipients = resolveRecipients({
    audience: input.audience,
    studentId: input.studentId,
    newOwnerRole: input.newOwnerRole,
    newOwnerId: input.newOwnerId,
  });

  const ids: string[] = [];
  for (const r of recipients) {
    const notification: Notification = {
      id: `ntf_${Math.random().toString(36).slice(2, 11)}`,
      userId: r.userId ?? input.studentId,  // for WhatsApp, link back to student
      title: input.title,
      message: input.messageBody,
      messageBody: input.messageBody,
      type: 'STAGE_CHANGED',
      read: false,
      link: input.link,
      entityId: input.studentId,
      audience: input.audience,
      channel: r.kind,
      recipientName: r.name,
      recipientPhone: r.phone,
      simulated: true,
      createdAt: new Date().toISOString(),
    };
    mockNotifications.unshift(notification);
    ids.push(notification.id);
  }
  return ids;
}
```

- [ ] **Step 5: Run tests - expect all to PASS**

```bash
npm test
```

Expected: 7 tests pass (6 new + 1 sanity).

- [ ] **Step 6: Commit**

```bash
git add lib/mock/mockNotifications.ts lib/pipeline/notify.ts lib/pipeline/notify.test.ts
git commit -m "feat(pipeline): notification recipient resolution + simulated send

resolveRecipients() routes STUDENT/PARENT_PRIMARY/ALL_PARENTS/
NEW_OWNER/TEAM audiences to the right contacts. sendSimulated()
creates Notification records (one per recipient) and is the seam
to swap for a real WhatsApp provider later."
```

---

### Task 7: Main transition table (TDD)

**Files:**
- Create: `lib/pipeline/transitions.ts`
- Create: `lib/pipeline/transitions.test.ts`

- [ ] **Step 1: Write failing tests asserting the structure of every transition**

Create `lib/pipeline/transitions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { TRANSITIONS, getTransition, listTransitionsFrom } from './transitions';
import { PIPELINE_ORDER } from '@/types';

describe('TRANSITIONS table', () => {
  it('defines exactly 8 forward transitions', () => {
    expect(TRANSITIONS).toHaveLength(8);
  });

  it('covers every stage except MONITORING as a source', () => {
    const sources = new Set(TRANSITIONS.map(t => t.from));
    // 8 sources: every stage in PIPELINE_ORDER except the terminal MONITORING
    expect(sources.size).toBe(8);
    expect(sources.has('MONITORING')).toBe(false);
  });

  it('every transition moves exactly one step forward in PIPELINE_ORDER', () => {
    for (const t of TRANSITIONS) {
      const fromIdx = PIPELINE_ORDER.indexOf(t.from);
      const toIdx = PIPELINE_ORDER.indexOf(t.to);
      expect(toIdx).toBe(fromIdx + 1);
    }
  });

  it('every transition has at least one allowed role and one required field OR explicit zero', () => {
    for (const t of TRANSITIONS) {
      expect(t.allowedRoles.length).toBeGreaterThan(0);
      expect(Array.isArray(t.requiredFields)).toBe(true);
      expect(t.notify.length).toBeGreaterThan(0);
      expect(typeof t.messageTemplate).toBe('function');
    }
  });

  it('transition 1 LEAD->COUNSELING allows marketing roles', () => {
    const t = getTransition('LEAD');
    expect(t).toBeDefined();
    expect(t!.to).toBe('COUNSELING');
    expect(t!.allowedRoles).toEqual(
      expect.arrayContaining(['MARKETING_STAFF', 'SUB_AGENT', 'MARKETING_MANAGER'])
    );
    expect(t!.requiredFields.find(f => f.key === 'counselorAssigneeId')).toBeDefined();
  });

  it('transition 3 PAYMENT_PENDING->PAYMENT_CONFIRMED allows FINANCE only', () => {
    const t = getTransition('PAYMENT_PENDING');
    expect(t!.allowedRoles).toEqual(['FINANCE']);
    expect(t!.requiredFields.find(f => f.key === 'receiptNumber')).toBeDefined();
    expect(t!.requiredFields.find(f => f.key === 'amountReceived')).toBeDefined();
  });

  it('transition 5 APPLICATION_SUBMITTED->UNIVERSITY_ACCEPTED notifies ALL_PARENTS', () => {
    const t = getTransition('APPLICATION_SUBMITTED');
    expect(t!.notify).toEqual(expect.arrayContaining(['ALL_PARENTS']));
    expect(t!.requiredFields.find(f => f.key === 'offerLetterUrl')).toBeDefined();
  });

  it('messageTemplate substitutes context variables', () => {
    const t = getTransition('APPLICATION_SUBMITTED');
    const msg = t!.messageTemplate({
      studentName: 'John Doe',
      university: 'University of Manchester',
      capturedData: { offerLetterUrl: 'https://example.com/offer.pdf' },
    });
    expect(msg).toContain('University of Manchester');
  });

  it('listTransitionsFrom returns 1 transition for a non-terminal stage and 0 for MONITORING', () => {
    expect(listTransitionsFrom('LEAD')).toHaveLength(1);
    expect(listTransitionsFrom('MONITORING')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests - expect all to FAIL (module not found)**

```bash
npm test
```

Expected: 9 tests fail with import error.

- [ ] **Step 3: Implement `lib/pipeline/transitions.ts`**

```ts
import { PipelineStage, Role, ROLES, NotifyAudience } from '@/types';
import { FieldSpec } from './fields';

export interface TransitionCtx {
  studentName: string;
  university?: string;
  capturedData: Record<string, string | number | boolean | null | undefined>;
}

export interface TransitionDef {
  from: PipelineStage;
  to: PipelineStage;
  label: string;                          // button label
  allowedRoles: Role[];                   // who can trigger (MD always allowed implicitly)
  newOwnerRole: Role;                     // primary role that owns the destination stage
  requiredFields: FieldSpec[];
  notify: NotifyAudience[];               // student/parent notifications
  notifyTeams?: Role[];                   // additional TEAM in-app notifications (e.g., alert Finance)
  messageTemplate: (ctx: TransitionCtx) => string;
}

const $ = (v: unknown) => (v == null ? '' : String(v));

export const TRANSITIONS: TransitionDef[] = [
  {
    from: 'LEAD',
    to: 'COUNSELING',
    label: 'Send to Counseling',
    allowedRoles: [ROLES.MARKETING_STAFF, ROLES.SUB_AGENT, ROLES.MARKETING_MANAGER],
    newOwnerRole: ROLES.MARKETING_STAFF,
    requiredFields: [
      { key: 'counselorAssigneeId', label: 'Assign counselor', kind: 'userSelect', roles: [ROLES.MARKETING_STAFF, ROLES.MARKETING_MANAGER], required: true },
      { key: 'counselingNotes', label: 'Notes for counselor', kind: 'textarea', required: false },
    ],
    notify: ['STUDENT', 'PARENT_PRIMARY', 'NEW_OWNER'],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, your application is now with our counseling team. They'll reach out shortly to discuss your options.`,
  },
  {
    from: 'COUNSELING',
    to: 'PAYMENT_PENDING',
    label: 'Mark Counseling Complete',
    allowedRoles: [ROLES.MARKETING_STAFF, ROLES.MARKETING_MANAGER],
    newOwnerRole: ROLES.FINANCE,
    requiredFields: [
      { key: 'programConfirmed', label: 'Program & university confirmed with student?', kind: 'boolean', required: true, defaultValue: true },
      { key: 'counselingOutcome', label: 'Counseling outcome / summary', kind: 'textarea', required: true },
      { key: 'expectedAgencyFee', label: 'Expected agency fee (TZS)', kind: 'number', currency: 'TZS', min: 0, required: true },
    ],
    notify: ['STUDENT', 'PARENT_PRIMARY', 'NEW_OWNER'],
    notifyTeams: [ROLES.FINANCE],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, counseling is complete. Please make the agency fee payment of TZS ${$(ctx.capturedData.expectedAgencyFee)} to proceed with your application.`,
  },
  {
    from: 'PAYMENT_PENDING',
    to: 'PAYMENT_CONFIRMED',
    label: 'Record Payment & Confirm',
    allowedRoles: [ROLES.FINANCE],
    newOwnerRole: ROLES.ADMISSIONS,
    requiredFields: [
      { key: 'amountReceived', label: 'Amount received (TZS)', kind: 'number', currency: 'TZS', min: 0, required: true },
      { key: 'receiptNumber', label: 'Receipt number', kind: 'text', required: true },
      { key: 'paymentMethod', label: 'Payment method', kind: 'paymentMethodSelect', required: true },
      { key: 'proofUrl', label: 'Proof of payment URL', kind: 'url', required: false },
    ],
    notify: ['STUDENT', 'PARENT_PRIMARY', 'NEW_OWNER'],
    notifyTeams: [ROLES.ADMISSIONS],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, your payment of TZS ${$(ctx.capturedData.amountReceived)} has been received (receipt #${$(ctx.capturedData.receiptNumber)}). Your application is now with our admissions team.`,
  },
  {
    from: 'PAYMENT_CONFIRMED',
    to: 'APPLICATION_SUBMITTED',
    label: 'Mark Application Submitted',
    allowedRoles: [ROLES.ADMISSIONS],
    newOwnerRole: ROLES.ADMISSIONS,
    requiredFields: [
      { key: 'submissionDate', label: 'Submission date', kind: 'date', required: true },
      { key: 'universityConfirmed', label: 'University & program confirmed', kind: 'boolean', required: true, defaultValue: true },
    ],
    notify: ['STUDENT', 'PARENT_PRIMARY'],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, your application to ${ctx.university ?? 'your chosen university'} has been submitted. We'll update you when there's a decision.`,
  },
  {
    from: 'APPLICATION_SUBMITTED',
    to: 'UNIVERSITY_ACCEPTED',
    label: 'Record Offer & Acceptance',
    allowedRoles: [ROLES.ADMISSIONS],
    newOwnerRole: ROLES.TRAVEL,
    requiredFields: [
      { key: 'offerLetterUrl', label: 'Offer letter URL', kind: 'url', required: true },
      { key: 'offerAccepted', label: 'Student has accepted the offer', kind: 'boolean', required: true, defaultValue: true },
      { key: 'decisionDate', label: 'Decision date', kind: 'date', required: true },
    ],
    notify: ['STUDENT', 'ALL_PARENTS', 'NEW_OWNER'],
    notifyTeams: [ROLES.TRAVEL],
    messageTemplate: (ctx) =>
      `🎓 Congratulations ${ctx.studentName}! Your offer letter from ${ctx.university ?? 'the university'} is here: ${$(ctx.capturedData.offerLetterUrl)}. Our travel team will be in touch.`,
  },
  {
    from: 'UNIVERSITY_ACCEPTED',
    to: 'TRAVEL_PLANNING',
    label: 'Begin Travel Planning',
    allowedRoles: [ROLES.TRAVEL, ROLES.ADMISSIONS],
    newOwnerRole: ROLES.TRAVEL,
    requiredFields: [
      { key: 'travelRecordCreated', label: 'Create / link travel record', kind: 'boolean', required: true, defaultValue: true },
    ],
    notify: ['STUDENT', 'PARENT_PRIMARY', 'NEW_OWNER'],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, we're starting travel planning for you. Passport, visa, flight and arrival will be tracked one by one - you'll get a message at every step.`,
  },
  {
    from: 'TRAVEL_PLANNING',
    to: 'TRAVELLED',
    label: 'Mark as Travelled',
    allowedRoles: [ROLES.TRAVEL],
    newOwnerRole: ROLES.OPERATIONS,
    requiredFields: [
      // No fields - gating happens via travelStepStatus check in advanceStudent
    ],
    notify: ['STUDENT', 'ALL_PARENTS', 'NEW_OWNER'],
    notifyTeams: [ROLES.OPERATIONS],
    messageTemplate: (ctx) =>
      `Safe travels, ${ctx.studentName}! All four travel sub-steps are complete. Our operations team will check in once you arrive.`,
  },
  {
    from: 'TRAVELLED',
    to: 'MONITORING',
    label: 'Confirm Arrival & Hand to Operations',
    allowedRoles: [ROLES.OPERATIONS, ROLES.TRAVEL],
    newOwnerRole: ROLES.OPERATIONS,
    requiredFields: [
      { key: 'arrivalConfirmedDate', label: 'Arrival confirmed date', kind: 'date', required: true },
      { key: 'localContactName', label: 'Local contact name', kind: 'text', required: true },
      { key: 'localContactPhone', label: 'Local contact phone', kind: 'text', required: true },
      { key: 'accommodationAddress', label: 'Accommodation address', kind: 'textarea', required: true },
    ],
    notify: ['STUDENT', 'ALL_PARENTS'],
    messageTemplate: (ctx) =>
      `Welcome ${ctx.studentName}! Your arrival is confirmed. Your local contact is ${$(ctx.capturedData.localContactName)} (${$(ctx.capturedData.localContactPhone)}). We'll be in touch monthly to make sure everything is OK.`,
  },
];

export function getTransition(from: PipelineStage): TransitionDef | undefined {
  return TRANSITIONS.find(t => t.from === from);
}

export function listTransitionsFrom(from: PipelineStage): TransitionDef[] {
  return TRANSITIONS.filter(t => t.from === from);
}
```

- [ ] **Step 4: Run tests - expect all to PASS**

```bash
npm test
```

Expected: 9 + previous (6 + 1) = 16 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/transitions.ts lib/pipeline/transitions.test.ts
git commit -m "feat(pipeline): main 8-transition table

Defines every forward stage move in one declarative table -
source, target, allowed roles, required fields, notification
recipients, WhatsApp message template. See spec section 5."
```

---

### Task 8: Travel sub-step table (TDD)

**Files:**
- Create: `lib/pipeline/travelSteps.ts`
- Create: `lib/pipeline/travelSteps.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/pipeline/travelSteps.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  TRAVEL_STEP_DEFS,
  getTravelStepDef,
  allTravelStepsDone,
} from './travelSteps';
import { TravelStepStatusMap } from '@/types';

describe('TRAVEL_STEP_DEFS', () => {
  it('defines exactly 4 sub-steps in order', () => {
    expect(TRAVEL_STEP_DEFS).toHaveLength(4);
    expect(TRAVEL_STEP_DEFS.map(d => d.key)).toEqual(['passport', 'visa', 'flight', 'arrival']);
  });

  it('passport step requires passportNumber and passportExpiry', () => {
    const def = getTravelStepDef('passport');
    const keys = def!.requiredFields.map(f => f.key);
    expect(keys).toEqual(expect.arrayContaining(['passportNumber', 'passportExpiry']));
  });

  it('flight step requires booking fields', () => {
    const def = getTravelStepDef('flight');
    const keys = def!.requiredFields.map(f => f.key);
    expect(keys).toEqual(expect.arrayContaining(['flightDate', 'flightNumber', 'airline']));
  });

  it('all steps notify STUDENT at minimum', () => {
    for (const def of TRAVEL_STEP_DEFS) {
      expect(def.notifyOnDone).toContain('STUDENT');
    }
  });

  it('allTravelStepsDone is true only when all 4 are DONE', () => {
    const status: TravelStepStatusMap = {
      passport: 'DONE', visa: 'DONE', flight: 'DONE', arrival: 'DONE',
    };
    expect(allTravelStepsDone(status)).toBe(true);
    expect(allTravelStepsDone({ ...status, arrival: 'IN_PROGRESS' })).toBe(false);
    expect(allTravelStepsDone(undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests - expect FAIL**

```bash
npm test
```

Expected: 5 new tests fail.

- [ ] **Step 3: Implement `lib/pipeline/travelSteps.ts`**

```ts
import { NotifyAudience, Role, ROLES, TravelStepStatusMap, TravelSubStep } from '@/types';
import { FieldSpec } from './fields';

export interface TravelStepDef {
  key: TravelSubStep;
  label: string;
  allowedRoles: Role[];
  requiredFields: FieldSpec[];
  notifyOnDone: NotifyAudience[];
  messageTemplate: (ctx: { studentName: string; capturedData: Record<string, unknown> }) => string;
}

const $ = (v: unknown) => (v == null ? '' : String(v));

export const TRAVEL_STEP_DEFS: TravelStepDef[] = [
  {
    key: 'passport',
    label: 'Passport',
    allowedRoles: [ROLES.TRAVEL],
    requiredFields: [
      { key: 'passportNumber', label: 'Passport number', kind: 'text', required: true },
      { key: 'passportExpiry', label: 'Passport expiry date', kind: 'date', required: true },
    ],
    notifyOnDone: ['STUDENT', 'PARENT_PRIMARY'],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, your passport is ready ✓ (#${$(ctx.capturedData.passportNumber)}, expires ${$(ctx.capturedData.passportExpiry)}).`,
  },
  {
    key: 'visa',
    label: 'Visa',
    allowedRoles: [ROLES.TRAVEL],
    requiredFields: [
      { key: 'visaType', label: 'Visa type', kind: 'text', required: true },
      { key: 'visaApprovalDate', label: 'Visa approval date', kind: 'date', required: true },
      { key: 'visaExpiryDate', label: 'Visa expiry date', kind: 'date', required: true },
    ],
    notifyOnDone: ['STUDENT', 'ALL_PARENTS'],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, your ${$(ctx.capturedData.visaType)} visa has been approved ✓ (valid until ${$(ctx.capturedData.visaExpiryDate)}).`,
  },
  {
    key: 'flight',
    label: 'Flight',
    allowedRoles: [ROLES.TRAVEL],
    requiredFields: [
      { key: 'flightDate', label: 'Flight date', kind: 'date', required: true },
      { key: 'flightNumber', label: 'Flight number', kind: 'text', required: true },
      { key: 'airline', label: 'Airline', kind: 'text', required: true },
      { key: 'departureCity', label: 'Departure city', kind: 'text', required: true },
      { key: 'destinationCity', label: 'Destination city', kind: 'text', required: true },
      { key: 'ticketUrl', label: 'Ticket / e-ticket URL', kind: 'url', required: false },
    ],
    notifyOnDone: ['STUDENT', 'ALL_PARENTS'],
    messageTemplate: (ctx) =>
      `✈️ Flight booked, ${ctx.studentName}: ${$(ctx.capturedData.airline)} ${$(ctx.capturedData.flightNumber)} on ${$(ctx.capturedData.flightDate)} from ${$(ctx.capturedData.departureCity)} to ${$(ctx.capturedData.destinationCity)}.`,
  },
  {
    key: 'arrival',
    label: 'Arrival',
    allowedRoles: [ROLES.TRAVEL],
    requiredFields: [
      { key: 'arrivalConfirmedDate', label: 'Arrival confirmed date', kind: 'date', required: true },
      { key: 'airportPickupArranged', label: 'Airport pickup arranged', kind: 'boolean', required: true, defaultValue: false },
      { key: 'pickupContactName', label: 'Pickup contact name (if arranged)', kind: 'text', required: false },
      { key: 'pickupContactPhone', label: 'Pickup contact phone (if arranged)', kind: 'text', required: false },
    ],
    notifyOnDone: ['STUDENT', 'ALL_PARENTS'],
    messageTemplate: (ctx) =>
      `Arrival confirmed ✓ for ${ctx.studentName} on ${$(ctx.capturedData.arrivalConfirmedDate)}. Safe trip!`,
  },
];

export function getTravelStepDef(key: TravelSubStep): TravelStepDef | undefined {
  return TRAVEL_STEP_DEFS.find(d => d.key === key);
}

export function allTravelStepsDone(status: TravelStepStatusMap | undefined): boolean {
  if (!status) return false;
  return (
    status.passport === 'DONE' &&
    status.visa === 'DONE' &&
    status.flight === 'DONE' &&
    status.arrival === 'DONE'
  );
}

export function emptyTravelStepStatus(): TravelStepStatusMap {
  return {
    passport: 'NOT_STARTED',
    visa: 'NOT_STARTED',
    flight: 'NOT_STARTED',
    arrival: 'NOT_STARTED',
  };
}
```

- [ ] **Step 4: Run tests - expect PASS**

```bash
npm test
```

Expected: all tests pass (16 + 5 = 21).

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/travelSteps.ts lib/pipeline/travelSteps.test.ts
git commit -m "feat(pipeline): travel 4-step sub-pipeline table

Passport, Visa, Flight, Arrival sub-steps live inside
TRAVEL_PLANNING. Each has its own required fields and notification
template. The main TRAVEL_PLANNING -> TRAVELLED transition is
gated by allTravelStepsDone()."
```

---

### Task 9: Permission helper (TDD)

**Files:**
- Create: `lib/pipeline/permissions.ts`
- Create: `lib/pipeline/permissions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/pipeline/permissions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { canAdvance, canRevert } from './permissions';

describe('canAdvance', () => {
  it('allows FINANCE to advance PAYMENT_PENDING', () => {
    expect(canAdvance('FINANCE', 'PAYMENT_PENDING')).toBe(true);
  });

  it('blocks ADMISSIONS from advancing PAYMENT_PENDING', () => {
    expect(canAdvance('ADMISSIONS', 'PAYMENT_PENDING')).toBe(false);
  });

  it('MANAGING_DIRECTOR can advance any stage', () => {
    expect(canAdvance('MANAGING_DIRECTOR', 'PAYMENT_PENDING')).toBe(true);
    expect(canAdvance('MANAGING_DIRECTOR', 'LEAD')).toBe(true);
    expect(canAdvance('MANAGING_DIRECTOR', 'TRAVELLED')).toBe(true);
  });

  it('returns false for terminal stage (MONITORING has no forward transition)', () => {
    expect(canAdvance('OPERATIONS', 'MONITORING')).toBe(false);
    expect(canAdvance('MANAGING_DIRECTOR', 'MONITORING')).toBe(false);
  });
});

describe('canRevert', () => {
  it('only MANAGING_DIRECTOR can revert', () => {
    expect(canRevert('MANAGING_DIRECTOR')).toBe(true);
    expect(canRevert('FINANCE')).toBe(false);
    expect(canRevert('ADMISSIONS')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests - expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Implement `lib/pipeline/permissions.ts`**

```ts
import { PipelineStage, ROLES, Role } from '@/types';
import { getTransition } from './transitions';

export function canAdvance(role: Role, fromStage: PipelineStage): boolean {
  const t = getTransition(fromStage);
  if (!t) return false;
  if (role === ROLES.MANAGING_DIRECTOR) return true;
  return t.allowedRoles.includes(role);
}

export function canRevert(role: Role): boolean {
  return role === ROLES.MANAGING_DIRECTOR;
}
```

- [ ] **Step 4: Run tests - expect PASS**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/permissions.ts lib/pipeline/permissions.test.ts
git commit -m "feat(pipeline): permission helpers (canAdvance, canRevert)

MANAGING_DIRECTOR can advance any stage and revert; everyone
else can only advance from a stage their role owns per the
transition table."
```

---

## Phase C - Server actions (TDD)

### Task 10: `advanceStudent` server action (TDD)

**Files:**
- Create: `lib/actions/pipelineActions.ts`
- Create: `lib/actions/pipelineActions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/actions/pipelineActions.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { advanceStudent } from './pipelineActions';
import { mockStudents } from '@/lib/mock/mockStudents';
import { mockStageTransitions } from '@/lib/mock/mockStageTransitions';
import { mockNotifications } from '@/lib/mock/mockNotifications';

// helper: session shape matching what the action expects
const financeSession = { userId: 'usr_finance', fullName: 'Test Finance', role: 'FINANCE' as const };
const mdSession = { userId: 'usr_md', fullName: 'Test MD', role: 'MANAGING_DIRECTOR' as const };
const wrongSession = { userId: 'usr_x', fullName: 'Wrong', role: 'ADMISSIONS' as const };

function resetState(studentId: string, toStage: 'LEAD' | 'COUNSELING' | 'PAYMENT_PENDING') {
  const s = mockStudents.find(x => x.id === studentId);
  if (s) s.pipelineStage = toStage;
  mockStageTransitions.length = 0;
  mockNotifications.length = 0;
}

describe('advanceStudent', () => {
  beforeEach(() => resetState('std_001', 'PAYMENT_PENDING'));

  it('blocks advancing when role is not allowed', async () => {
    const result = await advanceStudent({
      studentId: 'std_001',
      capturedData: { amountReceived: 1000, receiptNumber: 'R-001', paymentMethod: 'CASH' },
      assigneeId: null,
      session: wrongSession,
    });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not allowed/i);
  });

  it('blocks advancing when a required field is missing', async () => {
    const result = await advanceStudent({
      studentId: 'std_001',
      capturedData: { amountReceived: 1000 },  // missing receiptNumber, paymentMethod
      assigneeId: null,
      session: financeSession,
    });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('advances PAYMENT_PENDING → PAYMENT_CONFIRMED when FINANCE provides all fields', async () => {
    const result = await advanceStudent({
      studentId: 'std_001',
      capturedData: { amountReceived: 50000, receiptNumber: 'R-001', paymentMethod: 'CASH' },
      assigneeId: null,
      session: financeSession,
    });
    expect(result.success).toBe(true);

    const s = mockStudents.find(x => x.id === 'std_001');
    expect(s!.pipelineStage).toBe('PAYMENT_CONFIRMED');
    expect(s!.stageEnteredAt).toBeDefined();
  });

  it('writes a StageTransition record on successful advance', async () => {
    await advanceStudent({
      studentId: 'std_001',
      capturedData: { amountReceived: 50000, receiptNumber: 'R-001', paymentMethod: 'CASH' },
      assigneeId: null,
      session: financeSession,
    });
    expect(mockStageTransitions).toHaveLength(1);
    expect(mockStageTransitions[0]).toMatchObject({
      studentId: 'std_001',
      fromStage: 'PAYMENT_PENDING',
      toStage: 'PAYMENT_CONFIRMED',
      triggeredByRole: 'FINANCE',
    });
    expect(mockStageTransitions[0].notificationsSent.length).toBeGreaterThan(0);
  });

  it('creates Notification records for STUDENT and at least one IN_APP recipient', async () => {
    await advanceStudent({
      studentId: 'std_001',
      capturedData: { amountReceived: 50000, receiptNumber: 'R-001', paymentMethod: 'CASH' },
      assigneeId: null,
      session: financeSession,
    });
    const studentNotifs = mockNotifications.filter(n => n.audience === 'STUDENT');
    expect(studentNotifs).toHaveLength(1);
    expect(studentNotifs[0].messageBody).toMatch(/50000|receipt|payment/i);

    const inAppNotifs = mockNotifications.filter(n => n.channel === 'IN_APP');
    expect(inAppNotifs.length).toBeGreaterThan(0);
  });

  it('MD can advance any stage even when their role is not in allowedRoles', async () => {
    resetState('std_001', 'LEAD');
    const result = await advanceStudent({
      studentId: 'std_001',
      capturedData: { counselorAssigneeId: 'usr_008' },
      assigneeId: 'usr_008',
      session: mdSession,
    });
    expect(result.success).toBe(true);
    expect(mockStudents.find(x => x.id === 'std_001')!.pipelineStage).toBe('COUNSELING');
  });

  it('blocks TRAVEL_PLANNING → TRAVELLED unless all travel sub-steps are DONE', async () => {
    resetState('std_001', 'PAYMENT_PENDING');
    const s = mockStudents.find(x => x.id === 'std_001')!;
    s.pipelineStage = 'TRAVEL_PLANNING';
    const travelSession = { userId: 'usr_travel', fullName: 'T', role: 'TRAVEL' as const };
    const result = await advanceStudent({
      studentId: 'std_001',
      capturedData: {},
      assigneeId: null,
      session: travelSession,
    });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/travel sub-steps|passport|visa|flight|arrival/i);
  });
});
```

- [ ] **Step 2: Run tests - expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Implement `lib/actions/pipelineActions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  PipelineStage,
  Role,
  Session,
  StageTransition,
  StageTransitionPayload,
  Notification,
  PIPELINE_ORDER,
} from '@/types';
import { mockStudents } from '@/lib/mock/mockStudents';
import { mockTravelRecords } from '@/lib/mock/mockTravel';
import { mockApplications } from '@/lib/mock/mockApplications';
import { mockPayments } from '@/lib/mock/mockPayments';
import { mockAuditLogs } from '@/lib/mock/mockAuditLogs';
import { mockStageTransitions } from '@/lib/mock/mockStageTransitions';
import { mockNotifications } from '@/lib/mock/mockNotifications';
import { getTransition } from '@/lib/pipeline/transitions';
import { canAdvance, canRevert } from '@/lib/pipeline/permissions';
import { sendSimulated } from '@/lib/pipeline/notify';
import { allTravelStepsDone, emptyTravelStepStatus } from '@/lib/pipeline/travelSteps';

// Minimal session type - the test passes a plain object; the real callers pass a full Session.
type ActionSession = Pick<Session, 'userId' | 'fullName' | 'role'>;

export interface AdvanceStudentInput {
  studentId: string;
  capturedData: StageTransitionPayload;
  assigneeId: string | null;       // null => "assign later"
  session: ActionSession;
}

export async function advanceStudent(input: AdvanceStudentInput): Promise<ActionResult> {
  const { studentId, capturedData, assigneeId, session } = input;

  const student = mockStudents.find(s => s.id === studentId);
  if (!student) return { success: false, message: 'Student not found.' };

  const transition = getTransition(student.pipelineStage);
  if (!transition) {
    return { success: false, message: `No forward transition exists from ${student.pipelineStage}.` };
  }

  if (!canAdvance(session.role, student.pipelineStage)) {
    return { success: false, message: `Your role (${session.role}) is not allowed to advance this student. Owner role: ${transition.allowedRoles.join(', ')}.` };
  }

  // Gate: travel sub-steps must be DONE before TRAVEL_PLANNING → TRAVELLED
  if (transition.from === 'TRAVEL_PLANNING' && transition.to === 'TRAVELLED') {
    const travel = mockTravelRecords.find(t => t.studentId === studentId);
    if (!travel || !allTravelStepsDone(travel.travelStepStatus)) {
      return { success: false, message: 'All four travel sub-steps (passport, visa, flight, arrival) must be DONE before marking as travelled.' };
    }
  }

  // Validate required fields
  const errors: Record<string, string[]> = {};
  for (const field of transition.requiredFields) {
    if (!field.required) continue;
    const value = capturedData[field.key];
    if (value === undefined || value === null || value === '') {
      errors[field.key] = [`${field.label} is required.`];
    }
  }
  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please complete all required fields.', errors };
  }

  // Side-effects per transition
  if (transition.to === 'PAYMENT_CONFIRMED') {
    applyPaymentSideEffect(studentId, capturedData);
  } else if (transition.to === 'APPLICATION_SUBMITTED') {
    applyApplicationSideEffect(student, capturedData);
  } else if (transition.to === 'TRAVEL_PLANNING') {
    applyTravelRecordSideEffect(student);
  }

  // Mutate student
  const fromStage = student.pipelineStage;
  student.pipelineStage = transition.to;
  student.stageEnteredAt = new Date().toISOString();
  student.updatedAt = student.stageEnteredAt;
  student.stageOwnerId = assigneeId ?? autoAssign(transition.newOwnerRole) ?? undefined;

  // Notify
  const notificationIds: string[] = [];
  const ctx = { studentName: student.fullName, university: student.targetUniversity, capturedData };
  const message = transition.messageTemplate(ctx);
  for (const audience of transition.notify) {
    const ids = sendSimulated({
      studentId,
      audience,
      newOwnerRole: transition.newOwnerRole,
      newOwnerId: student.stageOwnerId,
      title: `${student.fullName}: ${fromStage} → ${transition.to}`,
      messageBody: audience === 'NEW_OWNER'
        ? `${student.fullName} is now in your queue (${transition.to.replace(/_/g, ' ').toLowerCase()}).`
        : message,
      link: `/students/${studentId}`,
    });
    notificationIds.push(...ids);
  }
  if (transition.notifyTeams) {
    for (const team of transition.notifyTeams) {
      const ids = sendSimulated({
        studentId,
        audience: 'TEAM',
        newOwnerRole: team,
        title: `New student in ${transition.to.replace(/_/g, ' ').toLowerCase()}`,
        messageBody: `${student.fullName} has been moved to ${transition.to.replace(/_/g, ' ').toLowerCase()} and is awaiting your team.`,
        link: `/students/${studentId}`,
      });
      notificationIds.push(...ids);
    }
  }

  // Write StageTransition
  const record: StageTransition = {
    id: `stx_${Math.random().toString(36).slice(2, 11)}`,
    studentId,
    fromStage,
    toStage: transition.to,
    triggeredById: session.userId,
    triggeredByName: session.fullName,
    triggeredByRole: session.role,
    capturedData,
    notificationsSent: notificationIds,
    createdAt: new Date().toISOString(),
  };
  mockStageTransitions.push(record);

  // Write AuditLog
  mockAuditLogs.unshift({
    id: `aud_${Math.random().toString(36).slice(2, 11)}`,
    userId: session.userId,
    userName: session.fullName,
    userRole: session.role,
    action: 'STAGE_CHANGE',
    module: 'pipeline',
    detail: `Advanced ${student.fullName} from ${fromStage} to ${transition.to}`,
    entityId: studentId,
    entityType: 'Student',
    previousValue: fromStage,
    newValue: transition.to,
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/students');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/finance');
  revalidatePath('/applications');
  revalidatePath('/travel');
  revalidatePath('/dashboard');

  return { success: true, message: `${student.fullName} advanced to ${transition.to.replace(/_/g, ' ').toLowerCase()}.` };
}

function autoAssign(role: Role): string | null {
  // Simplified: leave null. Real impl would round-robin among role members.
  return null;
}

function applyPaymentSideEffect(studentId: string, data: StageTransitionPayload): void {
  const payment = mockPayments.find(p => p.studentId === studentId);
  const amount = Number(data.amountReceived ?? 0);
  const receipt = String(data.receiptNumber ?? '');
  if (payment) {
    payment.agencyFeePaid = (payment.agencyFeePaid ?? 0) + amount;
    payment.totalPaid = (payment.totalPaid ?? 0) + amount;
    payment.balance = (payment.totalDue ?? 0) - payment.totalPaid;
    payment.status = payment.balance <= 0 ? 'CLEARED' : payment.balance < payment.totalDue ? 'PARTIAL' : 'PENDING';
    payment.receiptNumbers = [...(payment.receiptNumbers ?? []), receipt].filter(Boolean);
    payment.lastPaymentDate = new Date().toISOString();
  }
  // If no payment record exists, skip - finance can backfill in a follow-up.
}

function applyApplicationSideEffect(student: typeof mockStudents[number], data: StageTransitionPayload): void {
  const existingId = data.applicationId ? String(data.applicationId) : undefined;
  if (existingId && mockApplications.find(a => a.id === existingId)) return;
  // Auto-create
  mockApplications.unshift({
    id: `app_${Math.random().toString(36).slice(2, 11)}`,
    studentId: student.id,
    studentName: student.fullName,
    university: student.targetUniversity,
    country: student.targetCountry,
    program: student.targetProgram,
    level: 'UNDERGRADUATE',
    intake: student.targetIntake,
    status: 'SUBMITTED',
    submissionDate: data.submissionDate ? String(data.submissionDate) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

function applyTravelRecordSideEffect(student: typeof mockStudents[number]): void {
  const existing = mockTravelRecords.find(t => t.studentId === student.id);
  if (existing) {
    if (!existing.travelStepStatus) existing.travelStepStatus = emptyTravelStepStatus();
    // Auto-mark passport DONE if student already has a passport on file
    if (student.passportNumber && existing.travelStepStatus.passport === 'NOT_STARTED') {
      existing.travelStepStatus.passport = 'DONE';
    }
    return;
  }
  mockTravelRecords.unshift({
    id: `trv_${Math.random().toString(36).slice(2, 11)}`,
    studentId: student.id,
    studentName: student.fullName,
    passportStatus: student.passportNumber ? 'HAS_PASSPORT' : 'APPLYING',
    passportNumber: student.passportNumber,
    visaStatus: 'NOT_STARTED',
    departureCity: '',
    destinationCity: student.targetCountry,
    airportPickupArranged: false,
    travelStatus: 'PLANNING',
    updatedAt: new Date().toISOString(),
    travelStepStatus: {
      ...emptyTravelStepStatus(),
      passport: student.passportNumber ? 'DONE' : 'NOT_STARTED',
    },
  });
}
```

- [ ] **Step 4: Run tests - expect PASS**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add lib/actions/pipelineActions.ts lib/actions/pipelineActions.test.ts
git commit -m "feat(actions): advanceStudent server action

Consults the transition table, checks permissions + required
fields, applies per-transition side effects (auto-link Payment,
Application, TravelRecord), mutates the student, sends simulated
notifications, and writes StageTransition + AuditLog records.
TRAVEL_PLANNING -> TRAVELLED is gated on travel sub-steps."
```

---

### Task 11: `advanceTravelStep` and `revertStage` actions (TDD)

**Files:**
- Modify: `lib/actions/pipelineActions.ts` (append two new exported actions)
- Modify: `lib/actions/pipelineActions.test.ts` (append two new describe blocks)

- [ ] **Step 1: Append failing tests**

Add to `lib/actions/pipelineActions.test.ts`:

```ts
import { advanceTravelStep, revertStage } from './pipelineActions';
import { mockTravelRecords } from '@/lib/mock/mockTravel';

describe('advanceTravelStep', () => {
  const travelSession = { userId: 'usr_travel', fullName: 'T', role: 'TRAVEL' as const };

  beforeEach(() => {
    const s = mockStudents.find(x => x.id === 'std_001')!;
    s.pipelineStage = 'TRAVEL_PLANNING';
    // ensure travel record exists
    let trv = mockTravelRecords.find(t => t.studentId === 'std_001');
    if (!trv) {
      mockTravelRecords.unshift({
        id: 'trv_test', studentId: 'std_001', studentName: s.fullName,
        passportStatus: 'APPLYING', visaStatus: 'NOT_STARTED',
        departureCity: '', destinationCity: 'UK', airportPickupArranged: false,
        travelStatus: 'PLANNING', updatedAt: new Date().toISOString(),
        travelStepStatus: { passport: 'NOT_STARTED', visa: 'NOT_STARTED', flight: 'NOT_STARTED', arrival: 'NOT_STARTED' },
      });
      trv = mockTravelRecords.find(t => t.studentId === 'std_001');
    } else {
      trv.travelStepStatus = { passport: 'NOT_STARTED', visa: 'NOT_STARTED', flight: 'NOT_STARTED', arrival: 'NOT_STARTED' };
    }
    mockStageTransitions.length = 0;
    mockNotifications.length = 0;
  });

  it('marks passport DONE and notifies when required fields provided', async () => {
    const result = await advanceTravelStep({
      studentId: 'std_001',
      step: 'passport',
      newStatus: 'DONE',
      capturedData: { passportNumber: 'X123', passportExpiry: '2030-01-01' },
      session: travelSession,
    });
    expect(result.success).toBe(true);

    const trv = mockTravelRecords.find(t => t.studentId === 'std_001')!;
    expect(trv.travelStepStatus!.passport).toBe('DONE');
    expect(mockNotifications.filter(n => n.audience === 'STUDENT')).toHaveLength(1);
    expect(mockStageTransitions).toHaveLength(1);
    expect(mockStageTransitions[0].capturedData.subStep).toBe('passport');
  });

  it('marks IN_PROGRESS without notification and without StageTransition record', async () => {
    const result = await advanceTravelStep({
      studentId: 'std_001',
      step: 'visa',
      newStatus: 'IN_PROGRESS',
      capturedData: {},
      session: travelSession,
    });
    expect(result.success).toBe(true);
    expect(mockTravelRecords.find(t => t.studentId === 'std_001')!.travelStepStatus!.visa).toBe('IN_PROGRESS');
    expect(mockNotifications).toHaveLength(0);
    expect(mockStageTransitions).toHaveLength(0);
  });

  it('blocks DONE when required fields are missing', async () => {
    const result = await advanceTravelStep({
      studentId: 'std_001',
      step: 'flight',
      newStatus: 'DONE',
      capturedData: { flightDate: '2026-09-10' }, // missing flightNumber, airline, etc.
      session: travelSession,
    });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('revertStage', () => {
  beforeEach(() => {
    const s = mockStudents.find(x => x.id === 'std_001')!;
    s.pipelineStage = 'UNIVERSITY_ACCEPTED';
    mockStageTransitions.length = 0;
    mockNotifications.length = 0;
  });

  it('rejects revert from non-MD role', async () => {
    const result = await revertStage({
      studentId: 'std_001',
      toStage: 'APPLICATION_SUBMITTED',
      reason: 'Offer withdrawn',
      session: { userId: 'usr_x', fullName: 'X', role: 'ADMISSIONS' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects revert when reason is missing', async () => {
    const result = await revertStage({
      studentId: 'std_001',
      toStage: 'APPLICATION_SUBMITTED',
      reason: '',
      session: { userId: 'usr_md', fullName: 'MD', role: 'MANAGING_DIRECTOR' },
    });
    expect(result.success).toBe(false);
  });

  it('reverts the stage when MD provides a reason; notifies NEW_OWNER only', async () => {
    const result = await revertStage({
      studentId: 'std_001',
      toStage: 'APPLICATION_SUBMITTED',
      reason: 'Offer withdrawn',
      session: { userId: 'usr_md', fullName: 'MD', role: 'MANAGING_DIRECTOR' },
    });
    expect(result.success).toBe(true);
    expect(mockStudents.find(x => x.id === 'std_001')!.pipelineStage).toBe('APPLICATION_SUBMITTED');
    expect(mockStageTransitions).toHaveLength(1);
    expect(mockStageTransitions[0].notes).toBe('Offer withdrawn');
    // No student/parent notifications, but NEW_OWNER (in-app) yes
    expect(mockNotifications.filter(n => n.audience === 'STUDENT')).toHaveLength(0);
    expect(mockNotifications.filter(n => n.audience === 'PARENT_PRIMARY' || n.audience === 'ALL_PARENTS')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests - expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Append `advanceTravelStep` and `revertStage` to `lib/actions/pipelineActions.ts`**

Append (still inside the same file). First, add these imports at the top of the file (alongside the existing imports from Task 10):

```ts
import { getTravelStepDef } from '@/lib/pipeline/travelSteps';
import { getStageOwners } from '@/lib/pipeline/stageOwnership';
import { TravelSubStep, TravelSubStepStatus, PIPELINE_ORDER as PIPELINE_ORDER_FOR_REVERT } from '@/types';
```

Then append the new exports at the bottom of the file:

```ts

export interface AdvanceTravelStepInput {
  studentId: string;
  step: TravelSubStep;
  newStatus: TravelSubStepStatus;
  capturedData: StageTransitionPayload;
  session: ActionSession;
}

export async function advanceTravelStep(input: AdvanceTravelStepInput): Promise<ActionResult> {
  const { studentId, step, newStatus, capturedData, session } = input;
  const student = mockStudents.find(s => s.id === studentId);
  if (!student) return { success: false, message: 'Student not found.' };
  if (student.pipelineStage !== 'TRAVEL_PLANNING') {
    return { success: false, message: 'Student is not in travel planning.' };
  }
  const def = getTravelStepDef(step);
  if (!def) return { success: false, message: `Unknown sub-step ${step}.` };
  if (session.role !== 'MANAGING_DIRECTOR' && !def.allowedRoles.includes(session.role)) {
    return { success: false, message: 'Not allowed.' };
  }

  const trv = mockTravelRecords.find(t => t.studentId === studentId);
  if (!trv) return { success: false, message: 'Travel record missing.' };
  if (!trv.travelStepStatus) trv.travelStepStatus = { passport: 'NOT_STARTED', visa: 'NOT_STARTED', flight: 'NOT_STARTED', arrival: 'NOT_STARTED' };

  // For DONE: validate required fields
  if (newStatus === 'DONE') {
    const errors: Record<string, string[]> = {};
    for (const f of def.requiredFields) {
      if (!f.required) continue;
      const v = capturedData[f.key];
      if (v === undefined || v === null || v === '') errors[f.key] = [`${f.label} is required.`];
    }
    if (Object.keys(errors).length) return { success: false, message: 'Please complete required fields.', errors };
  }

  // Apply captured data to the TravelRecord fields where applicable
  applyTravelCapturedData(trv, step, capturedData);

  trv.travelStepStatus[step] = newStatus;
  // When flight becomes DONE, auto-promote arrival from NOT_STARTED to IN_PROGRESS
  if (step === 'flight' && newStatus === 'DONE' && trv.travelStepStatus.arrival === 'NOT_STARTED') {
    trv.travelStepStatus.arrival = 'IN_PROGRESS';
  }
  trv.updatedAt = new Date().toISOString();

  // Notifications + StageTransition record only when reaching DONE
  let notificationIds: string[] = [];
  if (newStatus === 'DONE') {
    const message = def.messageTemplate({ studentName: student.fullName, capturedData });
    for (const audience of def.notifyOnDone) {
      const ids = sendSimulated({
        studentId,
        audience,
        newOwnerRole: 'TRAVEL',
        title: `${student.fullName}: travel ${step} ✓`,
        messageBody: message,
        link: `/students/${studentId}`,
      });
      notificationIds.push(...ids);
    }
    mockStageTransitions.push({
      id: `stx_${Math.random().toString(36).slice(2, 11)}`,
      studentId,
      fromStage: 'TRAVEL_PLANNING',
      toStage: 'TRAVEL_PLANNING',
      triggeredById: session.userId,
      triggeredByName: session.fullName,
      triggeredByRole: session.role,
      capturedData: { ...capturedData, subStep: step, newSubStepStatus: newStatus },
      notificationsSent: notificationIds,
      createdAt: new Date().toISOString(),
    });
  }

  revalidatePath('/travel');
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: `Travel sub-step ${step} → ${newStatus.toLowerCase()}.` };
}

function applyTravelCapturedData(trv: typeof mockTravelRecords[number], step: TravelSubStep, data: StageTransitionPayload): void {
  switch (step) {
    case 'passport':
      if (data.passportNumber) trv.passportNumber = String(data.passportNumber);
      if (data.passportExpiry) trv.passportExpiry = String(data.passportExpiry);
      if (data.passportNumber) trv.passportStatus = 'READY';
      break;
    case 'visa':
      if (data.visaType) trv.visaType = String(data.visaType);
      if (data.visaApprovalDate) trv.visaApprovalDate = String(data.visaApprovalDate);
      if (data.visaExpiryDate) trv.visaExpiryDate = String(data.visaExpiryDate);
      trv.visaStatus = 'APPROVED';
      break;
    case 'flight':
      if (data.flightDate) trv.flightDate = String(data.flightDate);
      if (data.flightNumber) trv.flightNumber = String(data.flightNumber);
      if (data.airline) trv.airline = String(data.airline);
      if (data.departureCity) trv.departureCity = String(data.departureCity);
      if (data.destinationCity) trv.destinationCity = String(data.destinationCity);
      break;
    case 'arrival':
      if (data.arrivalConfirmedDate) trv.updatedAt = String(data.arrivalConfirmedDate);
      if (typeof data.airportPickupArranged === 'boolean') trv.airportPickupArranged = data.airportPickupArranged;
      if (data.pickupContactName) trv.pickupContactName = String(data.pickupContactName);
      if (data.pickupContactPhone) trv.pickupContactPhone = String(data.pickupContactPhone);
      break;
  }
}

export interface RevertStageInput {
  studentId: string;
  toStage: PipelineStage;
  reason: string;
  session: ActionSession;
}

export async function revertStage(input: RevertStageInput): Promise<ActionResult> {
  const { studentId, toStage, reason, session } = input;
  if (!canRevert(session.role)) {
    return { success: false, message: 'Only Managing Director can revert a stage.' };
  }
  if (!reason || reason.trim().length === 0) {
    return { success: false, message: 'A reason is required when reverting.' };
  }
  const student = mockStudents.find(s => s.id === studentId);
  if (!student) return { success: false, message: 'Student not found.' };

  const fromIdx = PIPELINE_ORDER_FOR_REVERT.indexOf(student.pipelineStage);
  const toIdx = PIPELINE_ORDER_FOR_REVERT.indexOf(toStage);
  if (toIdx >= fromIdx) {
    return { success: false, message: 'Revert target must be earlier in the pipeline than the current stage.' };
  }

  const fromStage = student.pipelineStage;
  student.pipelineStage = toStage;
  student.stageEnteredAt = new Date().toISOString();
  student.updatedAt = student.stageEnteredAt;
  student.stageOwnerId = undefined;

  // Notify NEW_OWNER team only (no student/parent message)
  const owners = getStageOwners(toStage);
  const notificationIds: string[] = [];
  for (const ownerRole of owners) {
    const ids = sendSimulated({
      studentId,
      audience: 'TEAM',
      newOwnerRole: ownerRole,
      title: `${student.fullName} reverted to ${toStage.replace(/_/g, ' ').toLowerCase()}`,
      messageBody: `${student.fullName} has been moved back to ${toStage.replace(/_/g, ' ').toLowerCase()}. Reason: ${reason}`,
      link: `/students/${studentId}`,
    });
    notificationIds.push(...ids);
  }

  mockStageTransitions.push({
    id: `stx_${Math.random().toString(36).slice(2, 11)}`,
    studentId,
    fromStage,
    toStage,
    triggeredById: session.userId,
    triggeredByName: session.fullName,
    triggeredByRole: session.role,
    capturedData: {},
    notificationsSent: notificationIds,
    notes: reason,
    createdAt: new Date().toISOString(),
  });

  mockAuditLogs.unshift({
    id: `aud_${Math.random().toString(36).slice(2, 11)}`,
    userId: session.userId,
    userName: session.fullName,
    userRole: session.role,
    action: 'STAGE_CHANGE',
    module: 'pipeline',
    detail: `Reverted ${student.fullName} from ${fromStage} to ${toStage}. Reason: ${reason}`,
    entityId: studentId,
    entityType: 'Student',
    previousValue: fromStage,
    newValue: toStage,
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/students');
  revalidatePath(`/students/${studentId}`);
  return { success: true, message: `Reverted to ${toStage.replace(/_/g, ' ').toLowerCase()}.` };
}
```


- [ ] **Step 4: Run tests - expect PASS**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add lib/actions/pipelineActions.ts lib/actions/pipelineActions.test.ts
git commit -m "feat(actions): advanceTravelStep + revertStage

Sub-step transitions: only -> DONE writes a StageTransition and
fires WhatsApp notifications; IN_PROGRESS is a silent state mutation.
revertStage requires MD role + a reason, notifies the new owner
role's team only (no student/parent message)."
```

---

### Task 12: Guardian CRUD action

**Files:**
- Create: `lib/validations/guardian.ts`
- Create: `lib/actions/guardianActions.ts`

(No test file - these are thin CRUD wrappers around mock arrays.)

- [ ] **Step 1: Create `lib/validations/guardian.ts`**

```ts
import { z } from 'zod';

export const guardianSchema = z.object({
  studentId: z.string().min(1),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  relation: z.enum(['MOTHER', 'FATHER', 'GUARDIAN', 'SPONSOR', 'OTHER']),
  phone: z.string().min(7, 'Phone number is required'),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  isPrimary: z.union([z.boolean(), z.literal('on'), z.literal('off'), z.literal('true'), z.literal('false')]).optional(),
});

export type GuardianFormInput = z.infer<typeof guardianSchema>;
```

- [ ] **Step 2: Create `lib/actions/guardianActions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ActionResult, Guardian } from '@/types';
import { mockGuardians } from '@/lib/mock/mockGuardians';
import { guardianSchema } from '@/lib/validations/guardian';

function coerceIsPrimary(v: unknown): boolean {
  return v === true || v === 'on' || v === 'true';
}

export async function addGuardian(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  const parsed = guardianSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors.', errors: z.flattenError(parsed.error).fieldErrors };
  }
  const isPrimary = coerceIsPrimary(parsed.data.isPrimary);

  // Enforce exactly one primary per student
  if (isPrimary) {
    for (const g of mockGuardians) {
      if (g.studentId === parsed.data.studentId) g.isPrimary = false;
    }
  } else if (!mockGuardians.some(g => g.studentId === parsed.data.studentId)) {
    // First guardian - force primary
    // (will set below)
  }

  const forcedPrimary = isPrimary || !mockGuardians.some(g => g.studentId === parsed.data.studentId);

  const guardian: Guardian = {
    id: `gdn_${Math.random().toString(36).slice(2, 11)}`,
    studentId: parsed.data.studentId,
    fullName: parsed.data.fullName,
    relation: parsed.data.relation,
    phone: parsed.data.phone,
    whatsapp: parsed.data.whatsapp || undefined,
    email: parsed.data.email || undefined,
    isPrimary: forcedPrimary,
    createdAt: new Date().toISOString(),
  };
  mockGuardians.unshift(guardian);

  revalidatePath(`/students/${parsed.data.studentId}`);
  return { success: true, message: 'Guardian added.' };
}

export async function deleteGuardian(guardianId: string): Promise<ActionResult> {
  const idx = mockGuardians.findIndex(g => g.id === guardianId);
  if (idx === -1) return { success: false, message: 'Guardian not found.' };
  const [removed] = mockGuardians.splice(idx, 1);

  // If we removed the primary and another guardian exists, promote the first remaining one
  if (removed.isPrimary) {
    const next = mockGuardians.find(g => g.studentId === removed.studentId);
    if (next) next.isPrimary = true;
  }

  revalidatePath(`/students/${removed.studentId}`);
  return { success: true, message: 'Guardian removed.' };
}

export async function setPrimaryGuardian(guardianId: string): Promise<ActionResult> {
  const target = mockGuardians.find(g => g.id === guardianId);
  if (!target) return { success: false, message: 'Guardian not found.' };
  for (const g of mockGuardians) {
    if (g.studentId === target.studentId) g.isPrimary = g.id === guardianId;
  }
  revalidatePath(`/students/${target.studentId}`);
  return { success: true, message: `${target.fullName} is now the primary contact.` };
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add lib/validations/guardian.ts lib/actions/guardianActions.ts
git commit -m "feat(actions): guardian CRUD with primary-uniqueness enforcement"
```

---

## Phase D - UI primitives

### Task 13: `<AdvanceStageModal>` - generic dynamic form

**Files:**
- Create: `components/pipeline/AdvanceStageModal.tsx`

**Note:** This is the most complex UI piece. It renders fields dynamically from the transition table, previews notification messages, and submits via the server action.

- [ ] **Step 1: Create `components/pipeline/AdvanceStageModal.tsx`**

```tsx
'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Student, Session, StageTransitionPayload } from '@/types';
import { TransitionDef } from '@/lib/pipeline/transitions';
import { FieldSpec } from '@/lib/pipeline/fields';
import { resolveRecipients } from '@/lib/pipeline/notify';
import { mockUsers } from '@/lib/mock/mockUsers';
import { getPrimaryGuardian, getGuardiansForStudent } from '@/lib/mock/mockGuardians';
import { advanceStudent } from '@/lib/actions/pipelineActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Send } from 'lucide-react';

interface Props {
  student: Student;
  session: Session;
  transition: TransitionDef;
  open: boolean;
  onClose: () => void;
}

export function AdvanceStageModal({ student, session, transition, open, onClose }: Props) {
  const [values, setValues] = useState<StageTransitionPayload>(() => initialValues(transition.requiredFields));
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const eligibleAssignees = mockUsers.filter(u => u.role === transition.newOwnerRole && u.status === 'ACTIVE');

  const previewMessage = useMemo(() => {
    return transition.messageTemplate({
      studentName: student.fullName,
      university: student.targetUniversity,
      capturedData: values,
    });
  }, [transition, student, values]);

  const recipients = useMemo(() => {
    return transition.notify.flatMap(audience =>
      resolveRecipients({ audience, studentId: student.id, newOwnerRole: transition.newOwnerRole })
    );
  }, [transition, student.id]);

  const hasGuardians = getGuardiansForStudent(student.id).length > 0;
  const needsParent = transition.notify.some(a => a === 'PARENT_PRIMARY' || a === 'ALL_PARENTS');
  const showNoGuardianWarning = needsParent && !hasGuardians;

  function handleSubmit() {
    startTransition(async () => {
      const result = await advanceStudent({
        studentId: student.id,
        capturedData: values,
        assigneeId: assigneeId || null,
        session: { userId: session.userId, fullName: session.fullName, role: session.role },
      });
      if (result.success) {
        toast.success(result.message);
        recipients.forEach(r => {
          if (r.kind === 'WHATSAPP') toast.info(`WhatsApp (simulated) to ${r.name} ${r.phone ?? ''}`);
        });
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transition.label}</DialogTitle>
          <p className="text-sm text-gray-500">
            {student.fullName} · {transition.from.replace(/_/g, ' ').toLowerCase()} → {transition.to.replace(/_/g, ' ').toLowerCase()}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {transition.requiredFields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(v) => setValues({ ...values, [field.key]: v })}
            />
          ))}

          <div>
            <Label htmlFor="assignee">Assign next owner ({transition.newOwnerRole.replace(/_/g, ' ').toLowerCase()})</Label>
            <select
              id="assignee"
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Assign later (role-wide queue)</option>
              {eligibleAssignees.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>

          {showNoGuardianWarning && (
            <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>No parent contacts on file - only the student will be notified. Consider adding a guardian first.</span>
            </div>
          )}

          <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <p className="text-xs uppercase font-semibold text-gray-500 mb-2 flex items-center gap-1"><Send size={12} /> Notification preview</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewMessage}</p>
            <p className="text-xs text-gray-500 mt-2">Will be sent (simulated) to:</p>
            <ul className="text-xs text-gray-700 mt-1 list-disc list-inside">
              {recipients.length === 0 && <li>No recipients resolved</li>}
              {recipients.map((r, i) => (
                <li key={i}>{r.kind === 'WHATSAPP' ? '📱' : '🔔'} {r.name}{r.phone ? ` - ${r.phone}` : ''} ({r.kind.toLowerCase()})</li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? 'Advancing…' : transition.label}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function initialValues(fields: FieldSpec[]): StageTransitionPayload {
  const init: StageTransitionPayload = {};
  for (const f of fields) {
    if (f.kind === 'boolean') init[f.key] = ('defaultValue' in f && typeof f.defaultValue === 'boolean') ? f.defaultValue : false;
  }
  return init;
}

interface FieldInputProps {
  field: FieldSpec;
  value: string | number | boolean | null | undefined;
  onChange: (v: string | number | boolean | null) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const labelEl = (
    <Label htmlFor={field.key}>
      {field.label}{field.required ? ' *' : ''}
    </Label>
  );
  switch (field.kind) {
    case 'text':
    case 'url':
      return <div><span>{labelEl}</span><Input id={field.key} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} /></div>;
    case 'textarea':
      return <div><span>{labelEl}</span><Textarea id={field.key} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} /></div>;
    case 'number':
      return <div><span>{labelEl}</span><Input id={field.key} type="number" min={field.min} value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} /></div>;
    case 'date':
      return <div><span>{labelEl}</span><Input id={field.key} type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} /></div>;
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input id={field.key} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {labelEl}
        </div>
      );
    case 'select':
      return (
        <div>
          <span>{labelEl}</span>
          <select id={field.key} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            <option value="">-</option>
            {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    case 'userSelect': {
      const candidates = mockUsers.filter(u => field.roles.includes(u.role));
      return (
        <div>
          <span>{labelEl}</span>
          <select id={field.key} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            <option value="">-</option>
            {candidates.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.role.replace(/_/g, ' ').toLowerCase()})</option>)}
          </select>
        </div>
      );
    }
    case 'paymentMethodSelect':
      return (
        <div>
          <span>{labelEl}</span>
          <select id={field.key} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            <option value="">-</option>
            {['BANK_TRANSFER', 'CASH', 'CHEQUE', 'CARD', 'MOBILE_MONEY', 'PETTY_CASH'].map(m => <option key={m} value={m}>{m.replace(/_/g, ' ').toLowerCase()}</option>)}
          </select>
        </div>
      );
  }
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/pipeline/AdvanceStageModal.tsx
git commit -m "feat(ui): AdvanceStageModal - generic dynamic form driven by transition table

Renders the right inputs per FieldSpec, previews the WhatsApp message
and recipients before sending, warns when parent contacts are missing,
and submits via advanceStudent server action."
```

---

### Task 14: `<AdvanceStageButton>` wrapper

**Files:**
- Create: `components/pipeline/AdvanceStageButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import { Student, Session } from '@/types';
import { getTransition } from '@/lib/pipeline/transitions';
import { canAdvance } from '@/lib/pipeline/permissions';
import { allTravelStepsDone } from '@/lib/pipeline/travelSteps';
import { mockTravelRecords } from '@/lib/mock/mockTravel';
import { AdvanceStageModal } from './AdvanceStageModal';
import { Button } from '@/components/ui/button';
import { ChevronRight, Lock } from 'lucide-react';

interface Props {
  student: Student;
  session: Session;
  size?: 'sm' | 'default';
}

export function AdvanceStageButton({ student, session, size = 'default' }: Props) {
  const [open, setOpen] = useState(false);
  const transition = getTransition(student.pipelineStage);

  if (!transition) {
    return <span className="text-xs text-gray-400">No further stage</span>;
  }

  const allowed = canAdvance(session.role, student.pipelineStage);

  // Special gating for TRAVEL_PLANNING → TRAVELLED
  let gatedReason: string | null = null;
  if (transition.to === 'TRAVELLED') {
    const trv = mockTravelRecords.find(t => t.studentId === student.id);
    if (!trv || !allTravelStepsDone(trv.travelStepStatus)) {
      gatedReason = 'Complete all 4 travel sub-steps first';
    }
  }

  const tooltip = !allowed
    ? `${transition.allowedRoles.join(', ').toLowerCase()} must advance this student`
    : gatedReason ?? '';

  if (!allowed || gatedReason) {
    return (
      <Button size={size} variant="outline" disabled title={tooltip}>
        <Lock size={14} className="mr-1" />
        {transition.label}
      </Button>
    );
  }

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        {transition.label}
        <ChevronRight size={14} className="ml-1" />
      </Button>
      {open && (
        <AdvanceStageModal
          student={student}
          session={session}
          transition={transition}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Typecheck & lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/pipeline/AdvanceStageButton.tsx
git commit -m "feat(ui): AdvanceStageButton wrapping the modal with role/sub-step gating"
```

---

### Task 15: `<MyQueue>` widget

**Files:**
- Create: `components/pipeline/MyQueue.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import Link from 'next/link';
import { Student, Session } from '@/types';
import { mockStudents } from '@/lib/mock/mockStudents';
import { getStageOwners } from '@/lib/pipeline/stageOwnership';
import { AdvanceStageButton } from './AdvanceStageButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  session: Session;
  title?: string;
  emptyText?: string;
  limit?: number;
}

export function MyQueue({ session, title = 'My Queue', emptyText = 'No students waiting on you right now.', limit = 10 }: Props) {
  const students = mockStudents
    .filter(s => {
      const owners = getStageOwners(s.pipelineStage);
      return owners.includes(session.role) || s.stageOwnerId === session.userId;
    })
    .sort((a, b) => (a.stageEnteredAt ?? a.createdAt).localeCompare(b.stageEnteredAt ?? b.createdAt))
    .slice(0, limit);

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {students.length === 0 && <p className="text-sm text-gray-500">{emptyText}</p>}
        {students.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {students.map(s => <QueueRow key={s.id} student={s} session={session} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function QueueRow({ student, session }: { student: Student; session: Session }) {
  const days = daysSince(student.stageEnteredAt ?? student.createdAt);
  const badgeClass =
    days > 14 ? 'bg-red-100 text-red-700' :
    days > 7 ? 'bg-yellow-100 text-yellow-700' :
    'bg-gray-100 text-gray-600';

  return (
    <li className="py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <Link href={`/students/${student.id}`} className="font-medium text-gray-900 hover:underline truncate block">{student.fullName}</Link>
        <p className="text-xs text-gray-500 truncate">
          {student.pipelineStage.replace(/_/g, ' ').toLowerCase()} · <span className={`px-1.5 py-0.5 rounded ${badgeClass}`}>{days}d waiting</span>
        </p>
      </div>
      <AdvanceStageButton student={student} session={session} size="sm" />
    </li>
  );
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}
```

- [ ] **Step 2: Typecheck & lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/pipeline/MyQueue.tsx
git commit -m "feat(ui): MyQueue widget - role-based inbox of students awaiting action"
```

---

### Task 16: `<StageTimeline>` component

**Files:**
- Create: `components/pipeline/StageTimeline.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { StageTransition } from '@/types';

interface Props {
  transitions: StageTransition[];
}

export function StageTimeline({ transitions }: Props) {
  if (transitions.length === 0) {
    return <p className="text-sm text-gray-500">No stage transitions yet.</p>;
  }
  return (
    <ol className="relative border-l border-gray-200 ml-2">
      {transitions.map(t => (
        <li key={t.id} className="ml-4 pb-4">
          <div className="absolute w-3 h-3 bg-primary rounded-full -left-1.5 mt-1.5" />
          <p className="text-sm">
            <span className="font-medium text-gray-900">
              {t.fromStage.replace(/_/g, ' ').toLowerCase()} → {t.toStage.replace(/_/g, ' ').toLowerCase()}
            </span>
            {t.fromStage === t.toStage && t.capturedData.subStep ? (
              <span className="ml-1 text-xs text-gray-500">(travel: {String(t.capturedData.subStep)} → {String(t.capturedData.newSubStepStatus ?? 'DONE').toLowerCase()})</span>
            ) : null}
          </p>
          <p className="text-xs text-gray-500">
            by {t.triggeredByName} ({t.triggeredByRole.replace(/_/g, ' ').toLowerCase()}) · {new Date(t.createdAt).toLocaleString()}
          </p>
          {t.notes && <p className="text-xs text-yellow-700 mt-1">Note: {t.notes}</p>}
          {Object.keys(t.capturedData).filter(k => k !== 'subStep' && k !== 'newSubStepStatus').length > 0 && (
            <details className="mt-1">
              <summary className="text-xs text-gray-500 cursor-pointer">Captured data</summary>
              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(t.capturedData, null, 2)}</pre>
            </details>
          )}
          <p className="text-xs text-gray-400 mt-1">{t.notificationsSent.length} notifications sent (simulated)</p>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 2: Typecheck & lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/pipeline/StageTimeline.tsx
git commit -m "feat(ui): StageTimeline - vertical timeline of stage transitions"
```

---

### Task 17: `<SentMessagesPanel>` and `<GuardiansSection>` components

**Files:**
- Create: `components/pipeline/SentMessagesPanel.tsx`
- Create: `components/pipeline/GuardiansSection.tsx`

- [ ] **Step 1: Create `SentMessagesPanel.tsx`**

```tsx
import { Notification } from '@/types';

interface Props {
  notifications: Notification[];
}

export function SentMessagesPanel({ notifications }: Props) {
  const messages = notifications.filter(n =>
    n.audience === 'STUDENT' || n.audience === 'PARENT_PRIMARY' || n.audience === 'ALL_PARENTS'
  );

  if (messages.length === 0) {
    return <p className="text-sm text-gray-500">No messages sent yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {messages.map(m => (
        <li key={m.id} className="border border-gray-200 rounded-md p-3 bg-white">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-700">
              📱 To {m.recipientName} {m.recipientPhone ? <span className="text-gray-500">({m.recipientPhone})</span> : null}
              <span className="ml-2 text-gray-500 font-normal">· {m.audience?.replace(/_/g, ' ').toLowerCase()}</span>
            </p>
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">🟢 simulated</span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.messageBody ?? m.message}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Create `GuardiansSection.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Guardian, GuardianRelation } from '@/types';
import { addGuardian, deleteGuardian, setPrimaryGuardian } from '@/lib/actions/guardianActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Star, Plus } from 'lucide-react';

interface Props {
  studentId: string;
  guardians: Guardian[];
}

const RELATIONS: GuardianRelation[] = ['MOTHER', 'FATHER', 'GUARDIAN', 'SPONSOR', 'OTHER'];

export function GuardiansSection({ studentId, guardians }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    formData.set('studentId', studentId);
    startTransition(async () => {
      const result = await addGuardian(null, formData);
      if (result.success) { toast.success(result.message); setOpen(false); }
      else toast.error(result.message);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteGuardian(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handleMakePrimary(id: string) {
    startTransition(async () => {
      const result = await setPrimaryGuardian(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Guardians ({guardians.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus size={14} className="mr-1" /> Add Guardian</Button>
      </div>

      {guardians.length === 0 && <p className="text-sm text-gray-500">No guardians on file. Add one so parent notifications can be sent.</p>}

      <ul className="space-y-2">
        {guardians.map(g => (
          <li key={g.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3 bg-white">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {g.fullName} <span className="text-xs text-gray-500">({g.relation.toLowerCase()})</span>
                {g.isPrimary && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Primary</span>}
              </p>
              <p className="text-xs text-gray-500">{g.phone}{g.whatsapp ? ` · WhatsApp ${g.whatsapp}` : ''}{g.email ? ` · ${g.email}` : ''}</p>
            </div>
            <div className="flex items-center gap-1">
              {!g.isPrimary && <Button size="sm" variant="ghost" onClick={() => handleMakePrimary(g.id)} disabled={isPending} title="Make primary"><Star size={14} /></Button>}
              <Button size="sm" variant="ghost" onClick={() => handleDelete(g.id)} disabled={isPending} title="Delete"><Trash2 size={14} className="text-red-600" /></Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Guardian</DialogTitle></DialogHeader>
          <form action={handleAdd} className="space-y-3">
            <div><Label>Full name *</Label><Input name="fullName" required /></div>
            <div>
              <Label>Relation *</Label>
              <select name="relation" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" defaultValue="MOTHER">
                {RELATIONS.map(r => <option key={r} value={r}>{r.toLowerCase()}</option>)}
              </select>
            </div>
            <div><Label>Phone *</Label><Input name="phone" required placeholder="+255..." /></div>
            <div><Label>WhatsApp (if different)</Label><Input name="whatsapp" placeholder="+255..." /></div>
            <div><Label>Email</Label><Input name="email" type="email" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="isPrimary" name="isPrimary" /><Label htmlFor="isPrimary">Mark as primary contact</Label></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Adding…' : 'Add Guardian'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck & lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add components/pipeline/SentMessagesPanel.tsx components/pipeline/GuardiansSection.tsx
git commit -m "feat(ui): SentMessagesPanel + GuardiansSection components"
```

---

### Task 18: `<TravelChecklistCard>` component

**Files:**
- Create: `components/pipeline/TravelChecklistCard.tsx`
- Create: `components/pipeline/TravelStepModal.tsx`

- [ ] **Step 1: Create `TravelStepModal.tsx`**

```tsx
'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Session, StageTransitionPayload, TravelSubStep, TravelSubStepStatus } from '@/types';
import { getTravelStepDef } from '@/lib/pipeline/travelSteps';
import { resolveRecipients } from '@/lib/pipeline/notify';
import { advanceTravelStep } from '@/lib/actions/pipelineActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  studentId: string;
  studentName: string;
  step: TravelSubStep;
  currentStatus: TravelSubStepStatus;
  session: Session;
  open: boolean;
  onClose: () => void;
}

export function TravelStepModal({ studentId, studentName, step, currentStatus, session, open, onClose }: Props) {
  const def = getTravelStepDef(step);
  const [values, setValues] = useState<StageTransitionPayload>({});
  const [isPending, startTransition] = useTransition();
  const [targetStatus, setTargetStatus] = useState<TravelSubStepStatus>(currentStatus === 'NOT_STARTED' ? 'IN_PROGRESS' : 'DONE');

  const preview = useMemo(() => {
    if (!def || targetStatus !== 'DONE') return null;
    return def.messageTemplate({ studentName, capturedData: values });
  }, [def, targetStatus, studentName, values]);

  function handleSubmit() {
    if (!def) return;
    startTransition(async () => {
      const result = await advanceTravelStep({ studentId, step, newStatus: targetStatus, capturedData: values, session: { userId: session.userId, fullName: session.fullName, role: session.role } });
      if (result.success) { toast.success(result.message); onClose(); }
      else toast.error(result.message);
    });
  }

  if (!def) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Update: {def.label}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Set status to</Label>
            <select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value as TravelSubStepStatus)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="IN_PROGRESS">In progress (silent)</option>
              <option value="DONE">Done (sends notification)</option>
            </select>
          </div>

          {targetStatus === 'DONE' && def.requiredFields.map(field => (
            <div key={field.key}>
              <Label>{field.label}{field.required ? ' *' : ''}</Label>
              {field.kind === 'date' ? (
                <Input type="date" value={String(values[field.key] ?? '')} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
              ) : field.kind === 'textarea' ? (
                <Textarea value={String(values[field.key] ?? '')} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
              ) : field.kind === 'boolean' ? (
                <input type="checkbox" checked={Boolean(values[field.key])} onChange={(e) => setValues({ ...values, [field.key]: e.target.checked })} />
              ) : (
                <Input value={String(values[field.key] ?? '')} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
              )}
            </div>
          ))}

          {preview && (
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Notification preview</p>
              <p className="text-sm text-gray-800">{preview}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `TravelChecklistCard.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Session, TravelRecord, TravelSubStep, TravelSubStepStatus } from '@/types';
import { TRAVEL_STEP_DEFS, allTravelStepsDone } from '@/lib/pipeline/travelSteps';
import { TravelStepModal } from './TravelStepModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, CircleDashed } from 'lucide-react';

interface Props {
  studentId: string;
  studentName: string;
  travel: TravelRecord;
  session: Session;
}

export function TravelChecklistCard({ studentId, studentName, travel, session }: Props) {
  const [activeStep, setActiveStep] = useState<TravelSubStep | null>(null);

  const status = travel.travelStepStatus ?? { passport: 'NOT_STARTED', visa: 'NOT_STARTED', flight: 'NOT_STARTED', arrival: 'NOT_STARTED' };
  const doneCount = TRAVEL_STEP_DEFS.filter(d => status[d.key] === 'DONE').length;
  const allDone = allTravelStepsDone(status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Travel Checklist</span>
          <span className="text-sm font-normal text-gray-500">{doneCount}/4 complete{allDone && ' ✓'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-gray-100">
          {TRAVEL_STEP_DEFS.map(def => (
            <li key={def.key} className="py-3 flex items-center gap-3">
              <StepIcon status={status[def.key]} />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{def.label}</p>
                <p className="text-xs text-gray-500">{labelForStatus(status[def.key])}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveStep(def.key)}>Update</Button>
            </li>
          ))}
        </ul>
        {activeStep && (
          <TravelStepModal
            studentId={studentId}
            studentName={studentName}
            step={activeStep}
            currentStatus={status[activeStep]}
            session={session}
            open={true}
            onClose={() => setActiveStep(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function StepIcon({ status }: { status: TravelSubStepStatus }) {
  if (status === 'DONE') return <CheckCircle2 size={20} className="text-green-600" />;
  if (status === 'IN_PROGRESS') return <CircleDashed size={20} className="text-yellow-600" />;
  return <Circle size={20} className="text-gray-300" />;
}

function labelForStatus(s: TravelSubStepStatus): string {
  if (s === 'DONE') return 'Done';
  if (s === 'IN_PROGRESS') return 'In progress';
  return 'Not started';
}
```

- [ ] **Step 3: Typecheck & lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add components/pipeline/TravelChecklistCard.tsx components/pipeline/TravelStepModal.tsx
git commit -m "feat(ui): TravelChecklistCard + TravelStepModal for the 4-step sub-pipeline"
```

---

## Phase E - Page integrations & cleanup

### Task 19: Integrate components into the student detail page

**Files:**
- Modify: `app/(dashboard)/students/[id]/page.tsx`

- [ ] **Step 1: Read the current student detail page to find the integration points**

```bash
cat app/\(dashboard\)/students/\[id\]/page.tsx
```

- [ ] **Step 2: Add imports near the top**

Add to the imports block:

```ts
import { AdvanceStageButton } from '@/components/pipeline/AdvanceStageButton';
import { StageTimeline } from '@/components/pipeline/StageTimeline';
import { SentMessagesPanel } from '@/components/pipeline/SentMessagesPanel';
import { GuardiansSection } from '@/components/pipeline/GuardiansSection';
import { getTransitionsForStudent } from '@/lib/mock/mockStageTransitions';
import { getGuardiansForStudent } from '@/lib/mock/mockGuardians';
import { mockNotifications } from '@/lib/mock/mockNotifications';
```

- [ ] **Step 3: Inside the page component, after the existing stage display, add the AdvanceStageButton and three new sections**

Find where the student's `pipelineStage` is displayed. Replace any existing "Change stage" dropdown with the `<AdvanceStageButton>`. After the existing main content cards, add (assuming `session` and `student` are in scope):

```tsx
<div className="mt-4 flex items-center gap-2">
  <AdvanceStageButton student={student} session={session} />
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  <Card>
    <CardHeader><CardTitle>Guardians</CardTitle></CardHeader>
    <CardContent>
      <GuardiansSection studentId={student.id} guardians={getGuardiansForStudent(student.id)} />
    </CardContent>
  </Card>

  <Card>
    <CardHeader><CardTitle>Stage Timeline</CardTitle></CardHeader>
    <CardContent>
      <StageTimeline transitions={getTransitionsForStudent(student.id)} />
    </CardContent>
  </Card>
</div>

<Card className="mt-6">
  <CardHeader><CardTitle>Sent Messages (Simulated WhatsApp)</CardTitle></CardHeader>
  <CardContent>
    <SentMessagesPanel notifications={mockNotifications.filter(n => n.entityId === student.id)} />
  </CardContent>
</Card>
```

If `Card`, `CardHeader`, `CardContent`, `CardTitle` aren't imported, add them to existing imports.

- [ ] **Step 4: Add the MD-only `<RevertStageButton>` component**

Create `components/pipeline/RevertStageButton.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Student, Session, PipelineStage, PIPELINE_ORDER, ROLES } from '@/types';
import { revertStage } from '@/lib/actions/pipelineActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Undo2 } from 'lucide-react';

interface Props {
  student: Student;
  session: Session;
}

export function RevertStageButton({ student, session }: Props) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<PipelineStage | ''>('');
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  if (session.role !== ROLES.MANAGING_DIRECTOR) return null;

  const currentIdx = PIPELINE_ORDER.indexOf(student.pipelineStage);
  const earlierStages = PIPELINE_ORDER.slice(0, currentIdx);
  if (earlierStages.length === 0) return null;

  function handleSubmit() {
    if (!target || !reason.trim()) {
      toast.error('Pick a target stage and provide a reason.');
      return;
    }
    startTransition(async () => {
      const result = await revertStage({
        studentId: student.id,
        toStage: target as PipelineStage,
        reason,
        session: { userId: session.userId, fullName: session.fullName, role: session.role },
      });
      if (result.success) { toast.success(result.message); setOpen(false); setTarget(''); setReason(''); }
      else toast.error(result.message);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Undo2 size={14} className="mr-1" /> Revert stage (MD)
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revert {student.fullName}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Revert to stage</Label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as PipelineStage)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">-</option>
                {earlierStages.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Reason *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this student being moved back?" />
              <p className="text-xs text-gray-500 mt-1">The student & parents will NOT be notified. The target stage's team will be alerted in-app.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>{isPending ? 'Reverting…' : 'Revert'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

Then update the imports in `app/(dashboard)/students/[id]/page.tsx`:

```ts
import { RevertStageButton } from '@/components/pipeline/RevertStageButton';
```

And in the JSX, place it next to the `<AdvanceStageButton>`:

```tsx
<div className="mt-4 flex items-center gap-2">
  <AdvanceStageButton student={student} session={session} />
  <RevertStageButton student={student} session={session} />
</div>
```

- [ ] **Step 5: Remove any existing free-form stage dropdown / mutation**

Search the file for any `<select>` element bound to changing `pipelineStage` directly, or any inline call to `updateStudentStage` / `admitStudent`. Remove those UI elements and their handlers (the actions themselves are removed in Task 23).

- [ ] **Step 6: Verify: typecheck, lint, dev-server smoke test**

```bash
npm run typecheck && npm run lint
```

Then in a separate terminal: `npm run dev`. Visit `/students/std_001` while logged in as a FINANCE user (the seeded `std_001` is in `LEAD` initially; for testing, advance it through stages). Confirm:
- AdvanceStageButton renders
- RevertStageButton is hidden (you're not MD)
- Guardians section lists the 2 seeded guardians for std_001
- Stage Timeline is empty initially; after one advance, shows the row

Log out and log in as `md@ypit.com` (MD) - confirm RevertStageButton appears.

Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add app/\(dashboard\)/students/\[id\]/page.tsx components/pipeline/RevertStageButton.tsx
git commit -m "feat(students): wire pipeline UI into student detail page

Adds AdvanceStageButton, RevertStageButton (MD-only), Guardians,
Stage Timeline, Sent Messages sections. Removes the legacy
free-form stage dropdown."
```

---

### Task 20: Add Owner column + "Waiting on" filter to students table

**Files:**
- Modify: `app/(dashboard)/students/_components/StudentsTable.tsx`

- [ ] **Step 1: Read the file**

```bash
cat app/\(dashboard\)/students/_components/StudentsTable.tsx
```

- [ ] **Step 2: Add an "Owner" column**

Add an Owner column to the table header (between e.g. Stage and Actions). For the row, resolve the owner from `student.stageOwnerId` against `mockUsers`. Add this import:

```ts
import { mockUsers } from '@/lib/mock/mockUsers';
```

And in each row:

```tsx
<td className="px-4 py-3 text-sm">
  {student.stageOwnerId
    ? (mockUsers.find(u => u.id === student.stageOwnerId)?.fullName ?? 'Unknown')
    : <span className="text-gray-400">Unassigned</span>}
</td>
```

- [ ] **Step 3: Add a "Waiting on" filter chip strip above the table**

Above the table, add a row of role-filter chips. Use existing role constants:

```tsx
import { ROLES, Role } from '@/types';
import { getStageOwners } from '@/lib/pipeline/stageOwnership';

// inside the component, alongside other state:
const [filterRole, setFilterRole] = useState<Role | null>(null);

const filteredStudents = filterRole
  ? students.filter(s => getStageOwners(s.pipelineStage).includes(filterRole))
  : students;

// render above the table:
<div className="flex gap-2 mb-2 text-xs">
  <button onClick={() => setFilterRole(null)} className={`px-2 py-1 rounded ${filterRole === null ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
  {[ROLES.MARKETING_STAFF, ROLES.FINANCE, ROLES.ADMISSIONS, ROLES.TRAVEL, ROLES.OPERATIONS].map(r => (
    <button key={r} onClick={() => setFilterRole(r)} className={`px-2 py-1 rounded ${filterRole === r ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
      Waiting on {r.replace(/_/g, ' ').toLowerCase()}
    </button>
  ))}
</div>
```

Render `filteredStudents` instead of `students` in the table body.

- [ ] **Step 4: Typecheck, lint, manual verify**

```bash
npm run typecheck && npm run lint
```

`npm run dev` → `/students` → confirm Owner column shows, and clicking "Waiting on Finance" filters down to only students whose stage owner role is Finance.

- [ ] **Step 5: Commit**

```bash
git add app/\(dashboard\)/students/_components/StudentsTable.tsx
git commit -m "feat(students): add Owner column and 'Waiting on' role filter"
```

---

### Task 21: Add `<TravelChecklistCard>` to the travel detail page

**Files:**
- Modify: `app/(dashboard)/travel/[id]/page.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat app/\(dashboard\)/travel/\[id\]/page.tsx
```

- [ ] **Step 2: Wire in the checklist**

Add imports:

```ts
import { TravelChecklistCard } from '@/components/pipeline/TravelChecklistCard';
import { mockStudents } from '@/lib/mock/mockStudents';
```

Inside the rendered JSX (the travel record's main content), add:

```tsx
{travel && (() => {
  const student = mockStudents.find(s => s.id === travel.studentId);
  return student ? (
    <TravelChecklistCard
      studentId={student.id}
      studentName={student.fullName}
      travel={travel}
      session={session}
    />
  ) : null;
})()}
```

(Place it prominently - near the top of the main content area.)

- [ ] **Step 3: Typecheck, lint, manual verify**

```bash
npm run typecheck && npm run lint
```

`npm run dev` → `/travel/trv_001` (logged in as TRAVEL or MD) → click Update on Passport → confirm modal opens, save IN_PROGRESS works silently, save DONE shows a toast and creates a notification.

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/travel/\[id\]/page.tsx
git commit -m "feat(travel): wire TravelChecklistCard into travel detail page"
```

---

### Task 22: Place `<MyQueue>` on the dashboard and module pages

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Modify: `app/(dashboard)/finance/page.tsx`
- Modify: `app/(dashboard)/applications/page.tsx`
- Modify: `app/(dashboard)/travel/page.tsx`

- [ ] **Step 1: Add MyQueue to the dashboard page**

In `app/(dashboard)/dashboard/page.tsx`, after the existing PageHeader and above the KPI cards, add:

```tsx
import { MyQueue } from '@/components/pipeline/MyQueue';

// inside the JSX (session must already be parsed in the page):
<MyQueue session={session} />
```

- [ ] **Step 2: Add MyQueue to `/finance`**

In `app/(dashboard)/finance/page.tsx`, near the top of the main content, add:

```tsx
import { MyQueue } from '@/components/pipeline/MyQueue';

<MyQueue session={session} title="Students Awaiting Payment Confirmation" />
```

(Make sure `session` is in scope; if the page is currently server-only and doesn't parse session, add the same cookie-parse logic the students page uses.)

- [ ] **Step 3: Add MyQueue to `/applications`**

```tsx
import { MyQueue } from '@/components/pipeline/MyQueue';

<MyQueue session={session} title="Students Awaiting Application Action" />
```

- [ ] **Step 4: Add MyQueue to `/travel`**

```tsx
import { MyQueue } from '@/components/pipeline/MyQueue';

<MyQueue session={session} title="Students In Travel Planning" />
```

- [ ] **Step 5: Typecheck, lint, manual verify**

```bash
npm run typecheck && npm run lint
```

`npm run dev` → log in as each role in turn, visit dashboard + their module page, confirm the queue shows the right students. Empty-state copy should render when no students match.

- [ ] **Step 6: Commit**

```bash
git add app/\(dashboard\)/dashboard/page.tsx app/\(dashboard\)/finance/page.tsx app/\(dashboard\)/applications/page.tsx app/\(dashboard\)/travel/page.tsx
git commit -m "feat(ui): place MyQueue on dashboard and per-role module pages"
```

---

### Task 23: Remove legacy `updateStudentStage` and `admitStudent`

**Files:**
- Modify: `lib/actions/studentActions.ts`
- Search & remove any caller across the codebase

- [ ] **Step 1: Find callers**

```bash
grep -rn "updateStudentStage\|admitStudent" --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: For each caller found, replace the call site**

- If the call site was a "Change stage" dropdown, that should have been deleted in Task 19. Confirm nothing remains.
- If the call site was an "Admit" button, replace it with `<AdvanceStageButton>` (it will offer transition #5 when the student is in `APPLICATION_SUBMITTED`).
- If the caller is part of `lib/actions/genericActions.ts` or similar, remove the export from there too.

- [ ] **Step 3: Delete the two functions from `lib/actions/studentActions.ts`**

Open the file and delete the entire `updateStudentStage` function (currently lines 48–67) and the entire `admitStudent` function (currently lines 69–91). Also remove the now-unused `ADMITTED_STAGES` import if `studentActions.ts` no longer references it (but other files may - check `grep`).

- [ ] **Step 4: Typecheck & lint**

```bash
npm run typecheck && npm run lint
```

Fix any unused-import warnings.

- [ ] **Step 5: Manual smoke**

`npm run dev` → walk a student through the full pipeline from LEAD → MONITORING as the right user for each stage. Confirm:
- Wrong-role advance shows disabled button with tooltip
- Required fields block submission
- Notification toasts appear
- Sent Messages panel populates
- Stage Timeline grows
- Travel checklist gates transition #7 correctly
- MD can advance any stage (try logging in as MD)
- MD revert button appears (only for MD) and reverts to an earlier stage with a reason

- [ ] **Step 6: Commit**

```bash
git add lib/actions/studentActions.ts
git commit -m "refactor(students): remove legacy updateStudentStage and admitStudent

Both superseded by the transition-engine action (advanceStudent).
Free-form stage movement is no longer possible - every move
goes through the gated, audited, notification-emitting flow."
```

---

### Task 24: Final integration check

**Files:** none modified - verification only.

- [ ] **Step 1: Run full test + typecheck + lint + build**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

Expected: all green. Build succeeds (Next.js will catch any server/client boundary issues missed by typecheck).

- [ ] **Step 2: Smoke-test the happy path end-to-end**

`npm run dev`. Log in as the seeded users (or whatever the test creds are). Walk std_001 through LEAD → COUNSELING → PAYMENT_PENDING → PAYMENT_CONFIRMED → APPLICATION_SUBMITTED → UNIVERSITY_ACCEPTED → TRAVEL_PLANNING. Then on TRAVEL_PLANNING, walk all 4 sub-steps to DONE. Then advance to TRAVELLED → MONITORING.

After each step, confirm:
- Toast appears
- Notification recorded in Sent Messages panel
- Stage Timeline updated
- Student appears in next owner's MyQueue

- [ ] **Step 3: Smoke-test error paths**

- Try advancing without required fields → validation error
- Try advancing as wrong role → button disabled with tooltip
- Try advancing TRAVEL_PLANNING → TRAVELLED before sub-steps done → button disabled

- [ ] **Step 4: Commit the test-success state if any final tweaks were needed**

If everything is already green, skip commit.

---

## Done

The workflow is now live: every student stage advance is a gated, role-owned, notification-emitting trigger, with a 4-step travel sub-pipeline and full timeline + sent-messages visibility on the student profile.