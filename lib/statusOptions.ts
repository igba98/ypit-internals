import { StatusOption } from '@/components/shared/StatusSelect';
import { Role } from '@/types';

export const PIPELINE_STAGE_OPTIONS: StatusOption[] = [
  { value: 'LEAD', label: 'Lead', className: 'bg-gray-100 text-gray-700 border border-gray-200' },
  { value: 'COUNSELING', label: 'Counseling', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  { value: 'APPLICATION_SUBMITTED', label: 'Application Submitted', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  { value: 'UNIVERSITY_ACCEPTED', label: 'University Accepted', className: 'bg-green-100 text-green-800 border border-green-300' },
  { value: 'TRAVEL_PLANNING', label: 'Travel Planning', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  { value: 'TRAVELLED', label: 'Travelled', className: 'bg-primary text-white border border-primary' },
  { value: 'MONITORING', label: 'Monitoring', className: 'bg-gray-900 text-white border border-gray-900' },
];

export const PAYMENT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'PENDING', label: 'Pending', className: 'bg-gray-50 text-gray-700 border border-gray-200' },
  { value: 'PARTIAL', label: 'Partial', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'CLEARED', label: 'Cleared', className: 'bg-green-50 text-green-700 border border-green-200' },
  { value: 'OVERDUE', label: 'Overdue', className: 'bg-red-50 text-red-700 border border-red-200' },
];

export const APPLICATION_STATUS_OPTIONS: StatusOption[] = [
  { value: 'PREPARING', label: 'Preparing', className: 'bg-gray-50 text-gray-700 border border-gray-200' },
  { value: 'SUBMITTED', label: 'Submitted', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'UNDER_REVIEW', label: 'Under Review', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'ACCEPTED', label: 'Accepted', className: 'bg-green-50 text-green-700 border border-green-200' },
  { value: 'WAITLISTED', label: 'Waitlisted', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  { value: 'DEFERRED', label: 'Deferred', className: 'bg-gray-100 text-gray-700 border border-gray-200' },
  { value: 'REJECTED', label: 'Rejected', className: 'bg-red-50 text-red-700 border border-red-200' },
];

export const TRAVEL_STATUS_OPTIONS: StatusOption[] = [
  { value: 'PLANNING', label: 'Planning', className: 'bg-gray-50 text-gray-700 border border-gray-200' },
  { value: 'VISA_PENDING', label: 'Visa Pending', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'READY', label: 'Ready', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'TRAVELLED', label: 'Travelled', className: 'bg-green-50 text-green-700 border border-green-200' },
];

export const VISA_STATUS_OPTIONS: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started', className: 'bg-gray-50 text-gray-700 border border-gray-200' },
  { value: 'DOCUMENTS_GATHERING', label: 'Gathering Docs', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'APPLIED', label: 'Applied', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  { value: 'APPOINTMENT_BOOKED', label: 'Appointment Booked', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'APPROVED', label: 'Approved', className: 'bg-green-50 text-green-700 border border-green-200' },
  { value: 'APPEALING', label: 'Appealing', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  { value: 'REJECTED', label: 'Rejected', className: 'bg-red-50 text-red-700 border border-red-200' },
];

export const PASSPORT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'APPLYING', label: 'Applying', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'HAS_PASSPORT', label: 'Has Passport', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'READY', label: 'Ready', className: 'bg-green-50 text-green-700 border border-green-200' },
];

export const INVOICE_STATUS_OPTIONS: StatusOption[] = [
  { value: 'DRAFT', label: 'Draft', className: 'bg-gray-50 text-gray-700 border border-gray-200' },
  { value: 'SENT', label: 'Sent', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'PARTIAL', label: 'Partial', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'PAID', label: 'Paid', className: 'bg-green-50 text-green-700 border border-green-200' },
  { value: 'OVERDUE', label: 'Overdue', className: 'bg-red-50 text-red-700 border border-red-200' },
  { value: 'VOID', label: 'Void', className: 'bg-gray-100 text-gray-500 border border-gray-200 line-through' },
];

export const PAYROLL_STATUS_OPTIONS: StatusOption[] = [
  { value: 'DRAFT', label: 'Draft', className: 'bg-gray-50 text-gray-700 border border-gray-200' },
  { value: 'APPROVED', label: 'Approved', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'PAID', label: 'Paid', className: 'bg-green-50 text-green-700 border border-green-200' },
  { value: 'CANCELLED', label: 'Cancelled', className: 'bg-red-50 text-red-700 border border-red-200' },
];

export const EXPENSE_STATUS_OPTIONS: StatusOption[] = [
  { value: 'PENDING', label: 'Pending', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'APPROVED', label: 'Approved', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'PAID', label: 'Paid', className: 'bg-green-50 text-green-700 border border-green-200' },
  { value: 'REJECTED', label: 'Rejected', className: 'bg-red-50 text-red-700 border border-red-200' },
];

const ALL_ROLES: Role[] = [
  'MANAGING_DIRECTOR',
  'MARKETING_MANAGER',
  'IT_ADMIN',
  'FINANCE',
  'ADMISSIONS',
  'TRAVEL',
  'OPERATIONS',
  'MARKETING_STAFF',
  'SUB_AGENT',
];

export const EDIT_PERMISSIONS = {
  pipelineStage: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS'] as Role[],
  paymentStatus: ['MANAGING_DIRECTOR', 'FINANCE'] as Role[],
  applicationStatus: ['MANAGING_DIRECTOR', 'ADMISSIONS'] as Role[],
  travelStatus: ['MANAGING_DIRECTOR', 'TRAVEL'] as Role[],
  visaStatus: ['MANAGING_DIRECTOR', 'TRAVEL'] as Role[],
  passportStatus: ['MANAGING_DIRECTOR', 'TRAVEL'] as Role[],
  documentVerified: ['MANAGING_DIRECTOR', 'ADMISSIONS', 'TRAVEL'] as Role[],
};

export const canEdit = (field: keyof typeof EDIT_PERMISSIONS, role: Role) =>
  EDIT_PERMISSIONS[field].includes(role);

export { ALL_ROLES };
