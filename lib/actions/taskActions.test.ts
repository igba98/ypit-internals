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
    expect(t.activity.at(-1)!.actorId).toBe('usr_001');
    expect(t.activity.at(-1)!.actorName).toBe('David Mwangi');
  });
});

describe('blockTask', () => {
  it('requires a reason', async () => {
    seed({ assignedToIds: ['usr_001'], status: 'IN_PROGRESS' });
    const r = await blockTask(null, fd({ taskId: 'tsk_seed', reason: 'no' }));
    expect(r.success).toBe(false);
  });

  it('moves to BLOCKED with reason and emits audit log', async () => {
    seed({ assignedToIds: ['usr_002'], status: 'IN_PROGRESS' });
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
    expect(mockNotifications.some((n) => n.userId === 'usr_001' && n.type === 'SYSTEM_ALERT')).toBe(true);
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
