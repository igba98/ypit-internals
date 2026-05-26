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
