import { NotifyAudience, Role, ROLES, TravelStepStatusMap, TravelSubStep } from '@/types';
import { FieldSpec } from './fields';

export interface TravelStepDef {
  key: TravelSubStep;
  label: string;
  allowedRoles: Role[];
  requiredFields: FieldSpec[];
  notifyOnDone: NotifyAudience[];
  messageTemplate: (ctx: { studentName: string; capturedData: Record<string, unknown> }) => string;
}

const $ = (v: unknown) => (v == null ? '' : String(v));

export const TRAVEL_STEP_DEFS: TravelStepDef[] = [
  {
    key: 'passport',
    label: 'Passport',
    allowedRoles: [ROLES.TRAVEL],
    requiredFields: [
      { key: 'passportNumber', label: 'Passport number', kind: 'text', required: true },
      { key: 'passportExpiry', label: 'Passport expiry date', kind: 'date', required: true },
    ],
    notifyOnDone: ['STUDENT', 'PARENT_PRIMARY'],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, your passport is ready ✓ (#${$(ctx.capturedData.passportNumber)}, expires ${$(ctx.capturedData.passportExpiry)}).`,
  },
  {
    key: 'visa',
    label: 'Visa',
    allowedRoles: [ROLES.TRAVEL],
    requiredFields: [
      { key: 'visaType', label: 'Visa type', kind: 'text', required: true },
      { key: 'visaApprovalDate', label: 'Visa approval date', kind: 'date', required: true },
      { key: 'visaExpiryDate', label: 'Visa expiry date', kind: 'date', required: true },
    ],
    notifyOnDone: ['STUDENT', 'ALL_PARENTS'],
    messageTemplate: (ctx) =>
      `Hi ${ctx.studentName}, your ${$(ctx.capturedData.visaType)} visa has been approved ✓ (valid until ${$(ctx.capturedData.visaExpiryDate)}).`,
  },
  {
    key: 'flight',
    label: 'Flight',
    allowedRoles: [ROLES.TRAVEL],
    requiredFields: [
      { key: 'flightDate', label: 'Flight date', kind: 'date', required: true },
      { key: 'flightNumber', label: 'Flight number', kind: 'text', required: true },
      { key: 'airline', label: 'Airline', kind: 'text', required: true },
      { key: 'departureCity', label: 'Departure city', kind: 'text', required: true },
      { key: 'destinationCity', label: 'Destination city', kind: 'text', required: true },
      { key: 'ticketUrl', label: 'Ticket / e-ticket URL', kind: 'url', required: false },
    ],
    notifyOnDone: ['STUDENT', 'ALL_PARENTS'],
    messageTemplate: (ctx) =>
      `✈️ Flight booked, ${ctx.studentName}: ${$(ctx.capturedData.airline)} ${$(ctx.capturedData.flightNumber)} on ${$(ctx.capturedData.flightDate)} from ${$(ctx.capturedData.departureCity)} to ${$(ctx.capturedData.destinationCity)}.`,
  },
  {
    key: 'arrival',
    label: 'Arrival',
    allowedRoles: [ROLES.TRAVEL],
    requiredFields: [
      { key: 'arrivalConfirmedDate', label: 'Arrival confirmed date', kind: 'date', required: true },
      { key: 'airportPickupArranged', label: 'Airport pickup arranged', kind: 'boolean', required: true, defaultValue: false },
      { key: 'pickupContactName', label: 'Pickup contact name (if arranged)', kind: 'text', required: false },
      { key: 'pickupContactPhone', label: 'Pickup contact phone (if arranged)', kind: 'text', required: false },
    ],
    notifyOnDone: ['STUDENT', 'ALL_PARENTS'],
    messageTemplate: (ctx) =>
      `Arrival confirmed ✓ for ${ctx.studentName} on ${$(ctx.capturedData.arrivalConfirmedDate)}. Safe trip!`,
  },
];

export function getTravelStepDef(key: TravelSubStep): TravelStepDef | undefined {
  return TRAVEL_STEP_DEFS.find(d => d.key === key);
}

export function allTravelStepsDone(status: TravelStepStatusMap | undefined): boolean {
  if (!status) return false;
  return (
    status.passport === 'DONE' &&
    status.visa === 'DONE' &&
    status.flight === 'DONE' &&
    status.arrival === 'DONE'
  );
}

export function emptyTravelStepStatus(): TravelStepStatusMap {
  return {
    passport: 'NOT_STARTED',
    visa: 'NOT_STARTED',
    flight: 'NOT_STARTED',
    arrival: 'NOT_STARTED',
  };
}