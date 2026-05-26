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
  label: string;
  allowedRoles: Role[];
  newOwnerRole: Role;
  requiredFields: FieldSpec[];
  notify: NotifyAudience[];
  notifyTeams?: Role[];
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
      { key: 'proofUrl', label: 'Proof of payment (PDF, image, or document)', kind: 'file', accept: '.pdf,image/*,.doc,.docx,.xls,.xlsx,.txt', maxBytes: 10 * 1024 * 1024, required: false },
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
      `Congratulations ${ctx.studentName}! Your offer letter from ${ctx.university ?? 'the university'} is here: ${$(ctx.capturedData.offerLetterUrl)}. Our travel team will be in touch.`,
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
      `Hi ${ctx.studentName}, we're starting travel planning for you. Passport, visa, flight and arrival will be tracked one by one — you'll get a message at every step.`,
  },
  {
    from: 'TRAVEL_PLANNING',
    to: 'TRAVELLED',
    label: 'Mark as Travelled',
    allowedRoles: [ROLES.TRAVEL],
    newOwnerRole: ROLES.OPERATIONS,
    requiredFields: [],
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