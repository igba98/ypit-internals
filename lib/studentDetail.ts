import { Student, PaymentRecord, Application, TravelRecord, Document, PipelineStage } from '@/types';
import { mockPayments } from './mock/mockPayments';
import { mockApplications } from './mock/mockApplications';
import { mockTravelRecords } from './mock/mockTravel';
import { mockDocuments } from './mock/mockDocuments';

export type ActivityKind =
  | 'CREATED'
  | 'STAGE'
  | 'PAYMENT'
  | 'APPLICATION'
  | 'DOCUMENT'
  | 'VISA'
  | 'TRAVEL'
  | 'NOTE';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  title: string;
  description?: string;
  actor?: string;
  timestamp: string;
}

export interface StudentDetail {
  student: Student;
  payment: PaymentRecord | null;
  application: Application | null;
  travel: TravelRecord | null;
  documents: Document[];
  activity: ActivityEvent[];
}

const STAGE_LABELS: Record<PipelineStage, string> = {
  LEAD: "Lead captured",
  COUNSELING: "Moved to Counseling",
  PAYMENT_PENDING: "Marked as Payment Pending",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  APPLICATION_SUBMITTED: "Application Submitted",
  UNIVERSITY_ACCEPTED: "University Accepted",
  TRAVEL_PLANNING: "Travel Planning started",
  TRAVELLED: "Travelled to destination",
  MONITORING: "In Monitoring",
};

const STAGE_ORDER: PipelineStage[] = [
  'LEAD',
  'COUNSELING',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'APPLICATION_SUBMITTED',
  'UNIVERSITY_ACCEPTED',
  'TRAVEL_PLANNING',
  'TRAVELLED',
  'MONITORING',
];

/**
 * Synthesize a per-student activity timeline from related entity data.
 * Real events would come from an audit log; for mock UX we fan them out
 * across the student's known timestamps so the timeline feels alive.
 */
function buildActivity(
  student: Student,
  payment: PaymentRecord | null,
  application: Application | null,
  travel: TravelRecord | null,
  documents: Document[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const created = new Date(student.createdAt).getTime();
  const updated = new Date(student.updatedAt).getTime();

  // Registration
  events.push({
    id: `act_${student.id}_created`,
    kind: 'CREATED',
    title: `${student.fullName} registered`,
    description: `Captured via ${student.leadSource.replace(/_/g, ' ').toLowerCase()}.`,
    actor: student.assignedAgentName ?? 'System',
    timestamp: student.createdAt,
  });

  // Synthetic stage transitions - distribute evenly between createdAt and updatedAt.
  const currentIdx = STAGE_ORDER.indexOf(student.pipelineStage);
  if (currentIdx > 0 && updated > created) {
    const span = updated - created;
    for (let i = 1; i <= currentIdx; i++) {
      const stage = STAGE_ORDER[i];
      const at = new Date(created + (span * i) / (currentIdx + 1)).toISOString();
      events.push({
        id: `act_${student.id}_stage_${stage}`,
        kind: 'STAGE',
        title: STAGE_LABELS[stage],
        actor: student.assignedAgentName ?? 'System',
        timestamp: at,
      });
    }
  }

  // Payments
  if (payment) {
    if (payment.agencyFeeDate && payment.agencyFeePaid > 0) {
      events.push({
        id: `act_${student.id}_pay_agency`,
        kind: 'PAYMENT',
        title: 'Agency fee payment recorded',
        description: `${payment.currency} ${payment.agencyFeePaid.toLocaleString()} of ${payment.agencyFee.toLocaleString()}`,
        actor: 'Finance',
        timestamp: payment.agencyFeeDate,
      });
    }
    if (payment.applicationFeeDate && payment.applicationFeePaid > 0) {
      events.push({
        id: `act_${student.id}_pay_app`,
        kind: 'PAYMENT',
        title: 'Application fee paid',
        description: `${payment.currency} ${payment.applicationFeePaid.toLocaleString()}`,
        actor: 'Finance',
        timestamp: payment.applicationFeeDate,
      });
    }
    if (payment.tuitionFeeDate && payment.tuitionFeePaid > 0) {
      events.push({
        id: `act_${student.id}_pay_tuition`,
        kind: 'PAYMENT',
        title: 'Tuition payment recorded',
        description: `${payment.currency} ${payment.tuitionFeePaid.toLocaleString()} of ${payment.tuitionFee.toLocaleString()}`,
        actor: 'Finance',
        timestamp: payment.tuitionFeeDate,
      });
    }
    if (payment.hostelFeeDate && payment.hostelFeePaid > 0) {
      events.push({
        id: `act_${student.id}_pay_hostel`,
        kind: 'PAYMENT',
        title: 'Accommodation deposit paid',
        description: `${payment.currency} ${payment.hostelFeePaid.toLocaleString()}`,
        actor: 'Finance',
        timestamp: payment.hostelFeeDate,
      });
    }
  }

  // Application
  if (application) {
    if (application.submissionDate) {
      events.push({
        id: `act_${student.id}_app_submitted`,
        kind: 'APPLICATION',
        title: `Application submitted to ${application.university}`,
        description: `${application.program} - ${application.intake}`,
        actor: 'Admissions',
        timestamp: application.submissionDate,
      });
    }
    if (application.decisionDate) {
      const verbs: Record<string, string> = {
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
        UNDER_REVIEW: 'under review',
        WAITLISTED: 'waitlisted',
        DEFERRED: 'deferred',
      };
      const verb = verbs[application.status] ?? 'updated';
      events.push({
        id: `act_${student.id}_app_decision`,
        kind: 'APPLICATION',
        title: `${application.university} ${verb} the application`,
        description: application.decisionNotes,
        actor: 'Admissions',
        timestamp: application.decisionDate,
      });
    }
  }

  // Documents
  for (const doc of documents) {
    events.push({
      id: `act_${student.id}_doc_${doc.id}`,
      kind: 'DOCUMENT',
      title: `Document uploaded: ${doc.name}`,
      description: doc.verified ? 'Verified by reviewer' : 'Pending verification',
      actor: doc.uploadedBy,
      timestamp: doc.uploadedAt,
    });
  }

  // Travel / visa
  if (travel) {
    if (travel.visaApplicationDate) {
      events.push({
        id: `act_${student.id}_visa_applied`,
        kind: 'VISA',
        title: 'Visa application submitted',
        description: travel.visaType,
        actor: 'Travel',
        timestamp: travel.visaApplicationDate,
      });
    }
    if (travel.visaApprovalDate) {
      events.push({
        id: `act_${student.id}_visa_approved`,
        kind: 'VISA',
        title: 'Visa approved',
        description: `${travel.visaType} - valid through ${travel.visaExpiryDate ? new Date(travel.visaExpiryDate).toLocaleDateString() : 'TBD'}`,
        actor: 'Travel',
        timestamp: travel.visaApprovalDate,
      });
    }
    if (travel.flightDate && travel.travelStatus === 'TRAVELLED') {
      events.push({
        id: `act_${student.id}_travelled`,
        kind: 'TRAVEL',
        title: `Departed ${travel.departureCity} → ${travel.destinationCity}`,
        description: `${travel.airline} ${travel.flightNumber}`,
        actor: 'Travel',
        timestamp: travel.flightDate,
      });
    } else if (travel.flightDate) {
      events.push({
        id: `act_${student.id}_flight_booked`,
        kind: 'TRAVEL',
        title: 'Flight itinerary confirmed',
        description: `${travel.airline} ${travel.flightNumber} on ${new Date(travel.flightDate).toLocaleDateString()}`,
        actor: 'Travel',
        timestamp: travel.flightDate,
      });
    }
  }

  // Notes
  if (student.notes) {
    events.push({
      id: `act_${student.id}_note`,
      kind: 'NOTE',
      title: 'Note added to profile',
      description: student.notes,
      actor: student.assignedAgentName ?? 'System',
      timestamp: student.updatedAt,
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getStudentDetail(student: Student): StudentDetail {
  const payment = mockPayments.find(p => p.studentId === student.id) ?? null;
  const application = mockApplications.find(a => a.studentId === student.id) ?? null;
  const travel = mockTravelRecords.find(t => t.studentId === student.id) ?? null;
  const documents = mockDocuments.filter(d => d.studentId === student.id);
  const activity = buildActivity(student, payment, application, travel, documents);

  return { student, payment, application, travel, documents, activity };
}
