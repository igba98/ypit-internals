export const ROLES = {
  MANAGING_DIRECTOR: 'MANAGING_DIRECTOR',
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  IT_ADMIN: 'IT_ADMIN',
  FINANCE: 'FINANCE',
  ADMISSIONS: 'ADMISSIONS',
  TRAVEL: 'TRAVEL',
  OPERATIONS: 'OPERATIONS',
  MARKETING_STAFF: 'MARKETING_STAFF',
  SUB_AGENT: 'SUB_AGENT'
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];

export const PIPELINE_STAGES = {
  LEAD: 'LEAD',
  COUNSELING: 'COUNSELING',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  UNIVERSITY_ACCEPTED: 'UNIVERSITY_ACCEPTED',
  TRAVEL_PLANNING: 'TRAVEL_PLANNING',
  TRAVELLED: 'TRAVELLED',
  MONITORING: 'MONITORING'
} as const;
export type PipelineStage = typeof PIPELINE_STAGES[keyof typeof PIPELINE_STAGES];

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'REPORTED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type LeadSource = 'SOCIAL_MEDIA' | 'SCHOOL_VISIT' | 'SUB_AGENT' | 'REFERRAL' | 'WALK_IN' | 'WEBSITE';
export type ApplicationStatus = 'PREPARING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WAITLISTED' | 'DEFERRED';
export type VisaStatus = 'NOT_STARTED' | 'DOCUMENTS_GATHERING' | 'APPLIED' | 'APPOINTMENT_BOOKED' | 'APPROVED' | 'REJECTED' | 'APPEALING';
export type PassportStatus = 'HAS_PASSPORT' | 'APPLYING' | 'READY';
export type TravelStatus = 'PLANNING' | 'VISA_PENDING' | 'READY' | 'TRAVELLED';
export type WellbeingStatus = 'GOOD' | 'NEEDS_ATTENTION' | 'ESCALATED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'CLEARED' | 'OVERDUE';
export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type NotificationType = 'TASK_ASSIGNED' | 'REPORT_SUBMITTED' | 'STAGE_CHANGED' | 'PAYMENT_RECORDED' | 'SYSTEM_ALERT' | 'DOCUMENT_UPLOADED' | 'CHECK_IN_LOGGED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: Role;
  department: string;
  avatar?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Session {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  department: string;
  avatar?: string;
}

export interface Student {
  id: string;
  fullName: string;
  avatar?: string;
  registrationNumber: string;
  nationality: string;
  passportNumber?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  age: number;
  email: string;
  phone: string;
  whatsapp?: string;
  targetUniversity: string;
  targetCountry: string;
  targetProgram: string;
  targetIntake: string;
  pipelineStage: PipelineStage;
  leadSource: LeadSource;
  assignedAgentId?: string;
  assignedAgentName?: string;
  marketingStaffId?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  source: LeadSource;
  interestedIn: string;
  interestedCountry?: string;
  status: 'NEW' | 'CONTACTED' | 'COUNSELED' | 'CONVERTED' | 'LOST';
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  followUpDate?: string;
  convertedStudentId?: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  agencyFee: number;
  agencyFeePaid: number;
  agencyFeeDate?: string;
  applicationFee: number;
  applicationFeePaid: number;
  applicationFeeDate?: string;
  tuitionFee: number;
  tuitionFeePaid: number;
  tuitionFeeDate?: string;
  hostelFee: number;
  hostelFeePaid: number;
  hostelFeeDate?: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  status: PaymentStatus;
  currency: string;
  receiptNumbers: string[];
  lastPaymentDate?: string;
  recordedBy?: string;
  notes?: string;
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  university: string;
  country: string;
  program: string;
  level: 'UNDERGRADUATE' | 'POSTGRADUATE' | 'PHD' | 'DIPLOMA' | 'CERTIFICATE';
  intake: string;
  submissionDate?: string;
  status: ApplicationStatus;
  offerLetterUrl?: string;
  conditionsUrl?: string;
  decisionDate?: string;
  decisionNotes?: string;
  submittedBy?: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  studentId: string;
  type: 'PASSPORT' | 'TRANSCRIPT' | 'CERTIFICATE' | 'OFFER_LETTER' | 'VISA' | 'BANK_STATEMENT' | 'PHOTO' | 'REFERENCE_LETTER' | 'OTHER';
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  verified: boolean;
  notes?: string;
}

export interface TravelRecord {
  id: string;
  studentId: string;
  studentName: string;
  passportStatus: PassportStatus;
  passportNumber?: string;
  passportExpiry?: string;
  visaStatus: VisaStatus;
  visaType?: string;
  visaApplicationDate?: string;
  visaAppointmentDate?: string;
  visaApprovalDate?: string;
  visaExpiryDate?: string;
  flightDate?: string;
  flightNumber?: string;
  airline?: string;
  departureCity: string;
  destinationCity: string;
  destinationAirport?: string;
  airportPickupArranged: boolean;
  pickupContactName?: string;
  pickupContactPhone?: string;
  accommodationAddress?: string;
  travelStatus: TravelStatus;
  updatedAt: string;
}

export interface OperationsRecord {
  id: string;
  studentId: string;
  studentName: string;
  university: string;
  country: string;
  arrivalDate?: string;
  enrollmentConfirmed: boolean;
  enrollmentDate?: string;
  studentIdNumber?: string;
  accommodationAddress?: string;
  localContactName?: string;
  localContactPhone?: string;
  wellbeingStatus: WellbeingStatus;
  lastCheckIn?: string;
  checkInCount: number;
  escalationFlag: boolean;
  escalationReason?: string;
  notes?: string;
}

export interface CheckIn {
  id: string;
  studentId: string;
  studentName: string;
  wellbeingStatus: WellbeingStatus;
  notes: string;
  submittedById: string;
  submittedByName: string;
  createdAt: string;
}

export interface EndOfDayReport {
  taskSummary: string;
  progressMade: string;
  blockers?: string;
  tomorrowPlan: string;
  percentageComplete: number;
  submittedAt: string;
  submittedById: string;
  submittedByName: string;
  acknowledgedAt?: string;
  acknowledgedById?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToIds: string[];
  assignedToNames: string[];
  assignedById: string;
  assignedByName: string;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  endOfDayReport?: EndOfDayReport;
  attachmentUrls?: string[];
}

export interface Report {
  id: string;
  title: string;
  period: ReportPeriod;
  periodStart?: string;
  periodEnd?: string;
  submittedById: string;
  submittedByName: string;
  department: string;
  submittedToId?: string;
  submittedToName: string;
  submittedToRole: Role;
  summary: string;
  keyMetrics?: Record<string, string | number>;
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'ARCHIVED';
  createdAt: string;
  acknowledgedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PASSWORD_RESET' | 'ROLE_CHANGE' | 'STAGE_CHANGE' | 'PAYMENT_RECORDED' | 'REPORT_SUBMITTED' | 'TASK_ASSIGNED';
  module: string;
  detail: string;
  entityId?: string;
  entityType?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  entityId?: string;
  createdAt: string;
}

export interface KPIMetric {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendColor?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: Record<string, string[]>;
}
