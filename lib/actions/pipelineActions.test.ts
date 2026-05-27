import { describe, it, expect, beforeEach } from 'vitest';
import { advanceStudent, advanceTravelStep, revertStage } from './pipelineActions';
import { mockStudents } from '@/lib/mock/mockStudents';
import { mockStageTransitions } from '@/lib/mock/mockStageTransitions';
import { mockNotifications } from '@/lib/mock/mockNotifications';
import { mockTravelRecords } from '@/lib/mock/mockTravel';

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
      capturedData: { amountReceived: 1000 },
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

describe('advanceTravelStep', () => {
  const travelSession = { userId: 'usr_travel', fullName: 'T', role: 'TRAVEL' as const };

  beforeEach(() => {
    const s = mockStudents.find(x => x.id === 'std_001')!;
    s.pipelineStage = 'TRAVEL_PLANNING';
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
      capturedData: { flightDate: '2026-09-10' },
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
    expect(mockNotifications.filter(n => n.audience === 'STUDENT')).toHaveLength(0);
    expect(mockNotifications.filter(n => n.audience === 'PARENT_PRIMARY' || n.audience === 'ALL_PARENTS')).toHaveLength(0);
  });
});