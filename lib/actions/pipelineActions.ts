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

type ActionSession = Pick<Session, 'userId' | 'fullName' | 'role'>;

export interface AdvanceStudentInput {
  studentId: string;
  capturedData: StageTransitionPayload;
  assigneeId: string | null;
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

  if (transition.from === 'TRAVEL_PLANNING' && transition.to === 'TRAVELLED') {
    const travel = mockTravelRecords.find(t => t.studentId === studentId);
    if (!travel || !allTravelStepsDone(travel.travelStepStatus)) {
      return { success: false, message: 'All four travel sub-steps (passport, visa, flight, arrival) must be DONE before marking as travelled.' };
    }
  }

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

  if (transition.to === 'PAYMENT_CONFIRMED') {
    applyPaymentSideEffect(studentId, capturedData);
  } else if (transition.to === 'APPLICATION_SUBMITTED') {
    applyApplicationSideEffect(student, capturedData);
  } else if (transition.to === 'TRAVEL_PLANNING') {
    applyTravelRecordSideEffect(student);
  }

  const fromStage = student.pipelineStage;
  student.pipelineStage = transition.to;
  student.stageEnteredAt = new Date().toISOString();
  student.updatedAt = student.stageEnteredAt;
  student.stageOwnerId = assigneeId ?? autoAssign(transition.newOwnerRole) ?? undefined;

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

  try {
    revalidatePath('/students');
    revalidatePath(`/students/${studentId}`);
    revalidatePath('/finance');
    revalidatePath('/applications');
    revalidatePath('/travel');
    revalidatePath('/dashboard');
  } catch (e) {
    // Revalidation may fail in test environments where Next.js store is unavailable
  }

  return { success: true, message: `${student.fullName} advanced to ${transition.to.replace(/_/g, ' ').toLowerCase()}.` };
}

function autoAssign(role: Role): string | null {
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
}

function applyApplicationSideEffect(student: typeof mockStudents[number], data: StageTransitionPayload): void {
  const existingId = data.applicationId ? String(data.applicationId) : undefined;
  if (existingId && mockApplications.find(a => a.id === existingId)) return;
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