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
  TravelSubStep,
  TravelSubStepStatus,
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
import { allTravelStepsDone, emptyTravelStepStatus, getTravelStepDef } from '@/lib/pipeline/travelSteps';
import { getStageOwners } from '@/lib/pipeline/stageOwnership';

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

  if (newStatus === 'DONE') {
    const errors: Record<string, string[]> = {};
    for (const f of def.requiredFields) {
      if (!f.required) continue;
      const v = capturedData[f.key];
      if (v === undefined || v === null || v === '') errors[f.key] = [`${f.label} is required.`];
    }
    if (Object.keys(errors).length) return { success: false, message: 'Please complete required fields.', errors };
  }

  applyTravelCapturedData(trv, step, capturedData);

  trv.travelStepStatus[step] = newStatus;
  if (step === 'flight' && newStatus === 'DONE' && trv.travelStepStatus.arrival === 'NOT_STARTED') {
    trv.travelStepStatus.arrival = 'IN_PROGRESS';
  }
  trv.updatedAt = new Date().toISOString();

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

  try {
    revalidatePath('/travel');
    revalidatePath(`/students/${studentId}`);
  } catch {}
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

  const fromIdx = PIPELINE_ORDER.indexOf(student.pipelineStage);
  const toIdx = PIPELINE_ORDER.indexOf(toStage);
  if (toIdx >= fromIdx) {
    return { success: false, message: 'Revert target must be earlier in the pipeline than the current stage.' };
  }

  const fromStage = student.pipelineStage;
  student.pipelineStage = toStage;
  student.stageEnteredAt = new Date().toISOString();
  student.updatedAt = student.stageEnteredAt;
  student.stageOwnerId = undefined;

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

  try {
    revalidatePath('/students');
    revalidatePath(`/students/${studentId}`);
  } catch {}
  return { success: true, message: `Reverted to ${toStage.replace(/_/g, ' ').toLowerCase()}.` };
}