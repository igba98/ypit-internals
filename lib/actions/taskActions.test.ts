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
