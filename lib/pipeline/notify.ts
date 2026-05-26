import { Notification, NotifyAudience, NotifyChannel, Role } from '@/types';
import { mockStudents } from '@/lib/mock/mockStudents';
import { mockGuardians } from '@/lib/mock/mockGuardians';
import { mockUsers } from '@/lib/mock/mockUsers';
import { mockNotifications } from '@/lib/mock/mockNotifications';

export interface ResolvedRecipient {
  kind: NotifyChannel;
  userId?: string;
  name: string;
  phone?: string;
}

export interface ResolveRecipientsInput {
  audience: NotifyAudience;
  studentId: string;
  newOwnerRole: Role;
  newOwnerId?: string;
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
  messageBody: string;
  link?: string;
}

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
      userId: r.userId ?? input.studentId,
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