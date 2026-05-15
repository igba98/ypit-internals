'use server';

import { mockTravelRecords } from '../mock/mockTravel';
import { revalidatePath } from 'next/cache';
import { ActionResult, TravelStatus, VisaStatus, PassportStatus } from '@/types';

const TRAVEL_STATUSES: TravelStatus[] = ['PLANNING', 'VISA_PENDING', 'READY', 'TRAVELLED'];
const VISA_STATUSES: VisaStatus[] = [
  'NOT_STARTED',
  'DOCUMENTS_GATHERING',
  'APPLIED',
  'APPOINTMENT_BOOKED',
  'APPROVED',
  'REJECTED',
  'APPEALING',
];
const PASSPORT_STATUSES: PassportStatus[] = ['HAS_PASSPORT', 'APPLYING', 'READY'];

function findRecord(travelId: string) {
  return mockTravelRecords.find(t => t.id === travelId);
}

function revalidate(studentId: string) {
  revalidatePath('/travel');
  revalidatePath(`/students/${studentId}`);
}

export async function updateTravelStatus(travelId: string, newStatus: string): Promise<ActionResult> {
  if (!TRAVEL_STATUSES.includes(newStatus as TravelStatus)) {
    return { success: false, message: "Invalid travel status." };
  }
  const rec = findRecord(travelId);
  if (!rec) return { success: false, message: "Travel record not found." };
  rec.travelStatus = newStatus as TravelStatus;
  rec.updatedAt = new Date().toISOString();
  revalidate(rec.studentId);
  return { success: true, message: `Travel marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}.` };
}

export async function updateVisaStatus(travelId: string, newStatus: string): Promise<ActionResult> {
  if (!VISA_STATUSES.includes(newStatus as VisaStatus)) {
    return { success: false, message: "Invalid visa status." };
  }
  const rec = findRecord(travelId);
  if (!rec) return { success: false, message: "Travel record not found." };
  rec.visaStatus = newStatus as VisaStatus;
  rec.updatedAt = new Date().toISOString();
  if (newStatus === 'APPROVED' && !rec.visaApprovalDate) {
    rec.visaApprovalDate = new Date().toISOString();
  }
  if (newStatus === 'APPLIED' && !rec.visaApplicationDate) {
    rec.visaApplicationDate = new Date().toISOString();
  }
  revalidate(rec.studentId);
  return { success: true, message: `Visa marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}.` };
}

export async function updatePassportStatus(travelId: string, newStatus: string): Promise<ActionResult> {
  if (!PASSPORT_STATUSES.includes(newStatus as PassportStatus)) {
    return { success: false, message: "Invalid passport status." };
  }
  const rec = findRecord(travelId);
  if (!rec) return { success: false, message: "Travel record not found." };
  rec.passportStatus = newStatus as PassportStatus;
  rec.updatedAt = new Date().toISOString();
  revalidate(rec.studentId);
  return { success: true, message: `Passport marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}.` };
}
