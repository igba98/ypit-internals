'use server';

import { revalidatePath } from 'next/cache';
import { mockPayments } from '../mock/mockPayments';
import { mockApplications } from '../mock/mockApplications';
import { mockTravelRecords } from '../mock/mockTravel';
import { mockUsers } from '../mock/mockUsers';
import { mockOperationsRecords } from '../mock/mockOperations';
import { mockLeads } from '../mock/mockLeads';
import { mockStudents } from '../mock/mockStudents';
import { ActionResult } from '@/types';

type Collection = { id: string } & Record<string, unknown>;

const COLLECTIONS = {
  payments: mockPayments,
  applications: mockApplications,
  travel: mockTravelRecords,
  staff: mockUsers,
  monitoring: mockOperationsRecords,
  leads: mockLeads,
  students: mockStudents,
} as const;

type CollectionName = keyof typeof COLLECTIONS;

// Whitelist of editable fields per collection. Anything outside is dropped.
// Add/remove keys here when widening or tightening edit access.
const EDITABLE_FIELDS: Record<CollectionName, readonly string[]> = {
  payments: ['agencyFee', 'applicationFee', 'tuitionFee', 'hostelFee', 'currency', 'notes'],
  applications: ['university', 'country', 'program', 'level', 'intake', 'status', 'decisionNotes'],
  travel: ['passportNumber', 'passportExpiry', 'visaType', 'visaStatus', 'flightNumber', 'airline', 'departureCity', 'destinationCity', 'destinationAirport', 'accommodationAddress', 'travelStatus'],
  staff: ['fullName', 'phone', 'department', 'status'],
  monitoring: ['accommodationAddress', 'localContactName', 'localContactPhone', 'wellbeingStatus', 'escalationFlag', 'escalationReason', 'notes'],
  leads: ['fullName', 'phone', 'email', 'status', 'notes', 'followUpDate'],
  students: ['fullName', 'phone', 'whatsapp', 'targetUniversity', 'targetCountry', 'targetProgram', 'targetIntake', 'notes'],
};

const isCollectionName = (name: string): name is CollectionName => name in COLLECTIONS;

export async function genericEditRecord(
  collectionName: string,
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!isCollectionName(collectionName)) {
    return { success: false, message: `Invalid collection: ${collectionName}` };
  }

  const collection = COLLECTIONS[collectionName] as unknown as Collection[];
  const recordIndex = collection.findIndex(r => r.id === id);
  if (recordIndex === -1) {
    return { success: false, message: "Record not found." };
  }

  const original = collection[recordIndex];
  const updated: Collection = { ...original };
  const allowed = new Set(EDITABLE_FIELDS[collectionName]);

  for (const [key, value] of formData.entries()) {
    if (!allowed.has(key)) continue;

    const originalValue = original[key];
    if (typeof originalValue === 'number') {
      const n = Number(value);
      if (Number.isFinite(n)) updated[key] = n;
    } else if (typeof originalValue === 'boolean') {
      updated[key] = value === 'true';
    } else {
      updated[key] = String(value);
    }
  }

  if ('updatedAt' in updated) {
    updated.updatedAt = new Date().toISOString();
  }

  collection[recordIndex] = updated;

  revalidatePath(`/${collectionName}`);
  revalidatePath(`/${collectionName}/${id}`);

  return { success: true, message: "Record updated." };
}

export async function genericDeleteRecord(
  collectionName: string,
  id: string,
): Promise<ActionResult> {
  if (!isCollectionName(collectionName)) {
    return { success: false, message: `Invalid collection: ${collectionName}` };
  }

  const collection = COLLECTIONS[collectionName] as unknown as Collection[];
  const recordIndex = collection.findIndex(r => r.id === id);
  if (recordIndex === -1) {
    return { success: false, message: "Record not found." };
  }

  collection.splice(recordIndex, 1);

  revalidatePath(`/${collectionName}`);

  return { success: true, message: "Record deleted." };
}
