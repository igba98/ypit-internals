import { describe, it, expect, beforeEach } from 'vitest';
import { resolveRecipients, sendSimulated } from './notify';
import { mockStudents } from '@/lib/mock/mockStudents';
import { mockGuardians } from '@/lib/mock/mockGuardians';
import { mockNotifications } from '@/lib/mock/mockNotifications';

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

describe('sendSimulated', () => {
  beforeEach(() => {
    mockNotifications.length = 0;
  });

  it('creates one Notification per resolved recipient and returns their IDs', () => {
    const ids = sendSimulated({
      studentId: 'std_001',
      audience: 'ALL_PARENTS',
      newOwnerRole: 'FINANCE',
      title: 'Test transition',
      messageBody: 'Hello parents',
      link: '/students/std_001',
    });

    expect(ids).toHaveLength(2);
    expect(mockNotifications).toHaveLength(2);
    for (const n of mockNotifications) {
      expect(n.simulated).toBe(true);
      expect(n.channel).toBe('WHATSAPP');
      expect(n.messageBody).toBe('Hello parents');
      expect(n.message).toBe('Hello parents');
      expect(n.title).toBe('Test transition');
      expect(n.link).toBe('/students/std_001');
      expect(n.entityId).toBe('std_001');
      expect(n.type).toBe('STAGE_CHANGED');
      expect(n.read).toBe(false);
      expect(n.audience).toBe('ALL_PARENTS');
      expect(n.recipientPhone).toBeTruthy();
    }
  });

  it('for WHATSAPP recipients, sets Notification.userId to the studentId (no app user exists)', () => {
    sendSimulated({
      studentId: 'std_001',
      audience: 'STUDENT',
      newOwnerRole: 'FINANCE',
      title: 't',
      messageBody: 'm',
    });
    expect(mockNotifications).toHaveLength(1);
    expect(mockNotifications[0].userId).toBe('std_001');
    expect(mockNotifications[0].recipientName).toBe('John Doe');
  });

  it('for IN_APP recipients (NEW_OWNER), sets Notification.userId to each app user', () => {
    sendSimulated({
      studentId: 'std_001',
      audience: 'NEW_OWNER',
      newOwnerRole: 'FINANCE',
      title: 'Heads up',
      messageBody: 'New student in your queue',
    });

    expect(mockNotifications.length).toBeGreaterThan(0);
    for (const n of mockNotifications) {
      expect(n.channel).toBe('IN_APP');
      expect(n.userId).not.toBe('std_001');  // should be a user id, not the student
      expect(n.userId?.startsWith('usr_')).toBe(true);
    }
  });

  it('TEAM audience creates one IN_APP Notification per active user in the role', () => {
    const ids = sendSimulated({
      studentId: 'std_001',
      audience: 'TEAM',
      newOwnerRole: 'ADMISSIONS',
      title: 'Team alert',
      messageBody: 'New student arriving',
    });
    expect(ids.length).toBeGreaterThan(0);
    for (const n of mockNotifications) {
      expect(n.channel).toBe('IN_APP');
      expect(n.audience).toBe('TEAM');
    }
  });

  it('uses unshift so newest notifications appear first', () => {
    sendSimulated({ studentId: 'std_001', audience: 'STUDENT', newOwnerRole: 'FINANCE', title: 'first', messageBody: 'one' });
    sendSimulated({ studentId: 'std_001', audience: 'STUDENT', newOwnerRole: 'FINANCE', title: 'second', messageBody: 'two' });
    expect(mockNotifications[0].title).toBe('second');
    expect(mockNotifications[1].title).toBe('first');
  });
});