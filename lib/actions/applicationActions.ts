'use server';

import { mockApplications } from '../mock/mockApplications';
import { revalidatePath } from 'next/cache';
import { ActionResult, ApplicationStatus } from '@/types';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'PREPARING',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REJECTED',
  'WAITLISTED',
  'DEFERRED',
];

const DECISION_STATUSES: ApplicationStatus[] = ['ACCEPTED', 'REJECTED', 'WAITLISTED', 'DEFERRED'];

export async function updateApplicationStatus(applicationId: string, newStatus: string): Promise<ActionResult> {
  if (!APPLICATION_STATUSES.includes(newStatus as ApplicationStatus)) {
    return { success: false, message: "Invalid application status." };
  }
  const app = mockApplications.find(a => a.id === applicationId);
  if (!app) {
    return { success: false, message: "Application not found." };
  }

  const status = newStatus as ApplicationStatus;
  app.status = status;
  app.updatedAt = new Date().toISOString();

  if (status === 'SUBMITTED' && !app.submissionDate) {
    app.submissionDate = new Date().toISOString();
  }
  if (DECISION_STATUSES.includes(status) && !app.decisionDate) {
    app.decisionDate = new Date().toISOString();
  }

  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath(`/students/${app.studentId}`);

  return { success: true, message: `Application set to ${status.replace(/_/g, ' ').toLowerCase()}.` };
}
