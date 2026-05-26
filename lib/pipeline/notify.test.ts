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