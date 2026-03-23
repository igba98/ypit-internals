'use server';

import { revalidatePath } from 'next/cache';
import { mockPayments } from '../mock/mockPayments';
import { mockApplications } from '../mock/mockApplications';
import { mockTravelRecords } from '../mock/mockTravel';
import { mockUsers } from '../mock/mockUsers';
import { mockOperationsRecords } from '../mock/mockOperations';
import { mockLeads } from '../mock/mockLeads';
import { mockStudents } from '../mock/mockStudents';

const getCollection = (name: string): any[] | null => {
  switch (name) {
    case 'payments': return mockPayments;
    case 'applications': return mockApplications;
    case 'travel': return mockTravelRecords;
    case 'staff': return mockUsers;
    case 'monitoring': return mockOperationsRecords;
    case 'leads': return mockLeads;
    case 'students': return mockStudents;
    default: return null;
  }
};

export async function genericEditRecord(collectionName: string, id: string, formData: FormData) {
  const collection = getCollection(collectionName);
  if (!collection) throw new Error(`Invalid collection: ${collectionName}`);

  const recordIndex = collection.findIndex(r => r.id === id);
  if (recordIndex === -1) throw new Error("Record not found");

  const original = collection[recordIndex];
  const updated = { ...original };

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('$ACTION')) continue; // Skip NextJS internal action markers
    
    const originalValue = original[key];
    if (originalValue !== undefined) {
      if (typeof originalValue === 'number') {
        updated[key] = Number(value);
      } else if (typeof originalValue === 'boolean') {
        updated[key] = value === 'true';
      } else {
        updated[key] = String(value);
      }
    }
  }

  // Preserve complex types that aren't form inputs
  collection[recordIndex] = updated;
  
  // Hard refresh layout to push new state downwards globally
  revalidatePath('/');
  return { success: true };
}

export async function genericDeleteRecord(collectionName: string, id: string) {
  const collection = getCollection(collectionName);
  if (!collection) throw new Error(`Invalid collection: ${collectionName}`);

  const recordIndex = collection.findIndex(r => r.id === id);
  if (recordIndex !== -1) {
    collection.splice(recordIndex, 1);
  }
  
  revalidatePath('/');
  return { success: true };
}
