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

export const PIPELINE_ORDER: PipelineStage[] = [
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

export const ADMITTED_STAGES: PipelineStage[] = [
  'UNIVERSITY_ACCEPTED',
  'TRAVEL_PLANNING',
  'TRAVELLED',
  'MONITORING',
];

export type TaskStatus =
  | 'TODO' | 'IN_PROGRESS' | 'SUBMITTED'
  | 'CHANGES_REQUESTED' | 'REJECTED'
  | 'COMPLETED' | 'BLOCKED';

export type TaskActivityType =
  | 'CREATED' | 'STARTED' | 'SUBMITTED'
  | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'
  | 'BLOCKED' | 'UNBLOCKED'
  | 'EDITED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type LeadSource = 'SOCIAL_MEDIA' | 'SCHOOL_VISIT' | 'SUB_AGENT' | 'REFERRAL' | 'WALK_IN' | 'WEBSITE';
export type ApplicationStatus = 'PREPARING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WAITLISTED' | 'DEFERRED';
export type VisaStatus = 'NOT_STARTED' | 'DOCUMENTS_GATHERING' | 'APPLIED' | 'APPOINTMENT_BOOKED' | 'APPROVED' | 'REJECTED' | 'APPEALING';
export type PassportStatus = 'HAS_PASSPORT' | 'APPLYING' | 'READY';
export type TravelStatus = 'PLANNING' | 'VISA_PENDING' | 'READY' | 'TRAVELLED';
export type WellbeingStatus = 'GOOD' | 'NEEDS_ATTENTION' | 'ESCALATED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'CLEARED' | 'OVERDUE';
export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type NotificationType = 'TASK_ASSIGNED' | 'REPORT_SUBMITTED' | 'TASK_REVIEWED' | 'STAGE_CHANGED' | 'PAYMENT_RECORDED' | 'SYSTEM_ALERT' | 'DOCUMENT_UPLOADED' | 'CHECK_IN_LOGGED';

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
  assignedAgentName?: string | null;
  marketingStaffId?: string;
  marketingStaffName?: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  stageOwnerId?: string;
  stageOwnerName?: string | null;
  stageEnteredAt?: string;
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

export interface PaymentReceiptAttachment {
  receiptNumber: string;
  url: string;                      // data: URL (image / pdf / doc)
  filename: string;
  contentType: string;
  uploadedAt: string;
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
  receiptAttachments?: PaymentReceiptAttachment[];
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
  travelStepStatus?: TravelStepStatusMap;
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

export interface TaskAttachment {
  url: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  uploadedById: string;
  uploadedByName: string;
}

export interface TaskActivityEntry {
  id: string;
  type: TaskActivityType;
  at: string;
  actorId: string;
  actorName: string;
  note?: string;
  progressMade?: string;
  percentageComplete?: number;
  nextActions?: string;
  blockers?: string;
  attachments?: TaskAttachment[];
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
  referenceAttachments?: TaskAttachment[];
  activity: TaskActivityEntry[];
  isPersonal: boolean;
  currentRound: number;
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
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PASSWORD_RESET' | 'ROLE_CHANGE' | 'STAGE_CHANGE' | 'PAYMENT_RECORDED' | 'REPORT_SUBMITTED' | 'TASK_ASSIGNED' | 'TASK_SUBMITTED' | 'TASK_REVIEWED' | 'TASK_BLOCKED';
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
  audience?: NotifyAudience;
  channel?: NotifyChannel;
  messageBody?: string;
  recipientName?: string;
  recipientPhone?: string;
  simulated?: boolean;
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

// ============================================================
// FINANCE MODULE
// ============================================================

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'CHEQUE'
  | 'CARD'
  | 'MOBILE_MONEY'
  | 'PETTY_CASH';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'VOID';
export type InvoiceRecipientType = 'STUDENT' | 'VENDOR' | 'OTHER';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;                       // cuid (backend) or INV-2026-0001 (mock)
  /** Human-readable serial INV-YYYY-NNNN (backend-only). */
  invoiceNumber?: string;
  recipientType: InvoiceRecipientType;
  recipientId?: string;             // linked studentId / vendor id
  recipientName: string;
  description: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paidAmount: number;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
}

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface PayrollEntry {
  id: string;                       // PR-2026-MAR-001
  staffId: string;
  staffName: string;
  staffRole: Role;
  department: string;
  period: string;                   // "March 2026"
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  tax: number;                      // PAYE
  pension: number;                  // NSSF
  netPay: number;
  status: PayrollStatus;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export type PettyCashTxType = 'EXPENSE' | 'REPLENISHMENT' | 'INITIAL_FLOAT';
export type PettyCashCategory =
  | 'OFFICE_SUPPLIES'
  | 'TRANSPORT'
  | 'MEALS'
  | 'UTILITIES'
  | 'POSTAGE'
  | 'REPAIRS'
  | 'CLEANING'
  | 'STAFF_WELFARE'
  | 'COURIER'
  | 'OTHER';

export interface PettyCashTransaction {
  id: string;                       // cuid (backend) or PC-2026-0001 (mock)
  /** Human-readable serial PC-YYYY-NNNN (backend-only). */
  txNumber?: string;
  date: string;
  type: PettyCashTxType;
  category?: PettyCashCategory;
  description: string;
  amount: number;                   // always positive; sign derived from type
  currency: string;
  recipient?: string;
  voucherNumber?: string;           // PV-001
  balanceAfter: number;
  recordedById?: string;
  recordedByName?: string;
  notes?: string;
  receiptUrl?: string;              // data: URL for attached receipt (image / pdf / doc)
  receiptFilename?: string;
  receiptContentType?: string;
}

export type ExpenseCategory =
  | 'RENT'
  | 'UTILITIES'
  | 'INTERNET'
  | 'OFFICE_SUPPLIES'
  | 'TRAVEL'
  | 'MARKETING'
  | 'PROFESSIONAL_FEES'
  | 'INSURANCE'
  | 'EQUIPMENT'
  | 'TRAINING'
  | 'COMMISSIONS'
  | 'OTHER';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface Expense {
  id: string;                       // cuid (backend) or EXP-2026-0001 (mock)
  /** Human-readable serial EXP-YYYY-NNNN (backend-only). */
  expenseNumber?: string;
  category: ExpenseCategory;
  vendor?: string;
  description: string;
  amount: number;
  currency: string;
  date: string;                     // expense incurred date
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  approvedById?: string;
  approvedByName?: string;
  paidDate?: string;
  receiptUrl?: string;              // data: URL for attached receipt (image / pdf / doc)
  receiptFilename?: string;
  receiptContentType?: string;
  notes?: string;
  recordedById?: string;
  recordedByName?: string;
  createdAt: string;
}

// ============================================================
// FINANCE PHASE 1 — Catalog & per-student fee ledger
// ============================================================

export type Currency = 'TZS' | 'USD' | 'GBP' | 'EUR';

export type FeeType =
  | 'APPLICATION'
  | 'TUITION'
  | 'HOSTEL'
  | 'AGENCY'
  | 'DEPOSIT'
  | 'INSURANCE'
  | 'VISA'
  | 'AIRPORT_PICKUP'
  | 'OTHER';

export type StudyLevel = 'FOUNDATION' | 'BACHELOR' | 'MASTERS' | 'PHD' | 'DIPLOMA';

export type CatalogStatus = 'ACTIVE' | 'ARCHIVED';

export interface University {
  id: string;                       // uni_coventry_london
  name: string;                     // "Coventry University London"
  country: string;                  // "United Kingdom"
  city?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  defaultReportingMonths?: string[]; // ['September', 'January']
  status: CatalogStatus;
  createdAt: string;
}

export type FeeDueRule =
  | { kind: 'DAYS_FROM_ENROLLMENT'; days: number }
  | { kind: 'BEFORE_REPORTING_DATE'; days: number }
  | { kind: 'ON_ENROLLMENT' }
  | { kind: 'CUSTOM' };

export interface FeeDefault {
  type: FeeType;
  label?: string;
  amount: number;
  currency: Currency;
  dueRule: FeeDueRule;
  required: boolean;
}

export interface Package {
  id: string;                       // pkg_coventry_london_bachelor_business
  universityId: string;
  name: string;
  studyLevel: StudyLevel;
  program: string;
  description?: string;
  feeDefaults: FeeDefault[];
  status: CatalogStatus;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type FeeLineStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED';

export interface FeeLine {
  id: string;                       // fl_001
  type: FeeType;
  label: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  paidAmount: number;
  status: FeeLineStatus;
  overrideReason?: string;
  overriddenById?: string;
  overriddenByName?: string;
  overriddenAt?: string;
  sourceFeeDefaultIndex?: number;
}

export interface StudentFeeLedger {
  studentId: string;
  packageId?: string;
  currencyDisplay?: Currency;       // KPI rollup pref; default TZS
  lines: FeeLine[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// PIPELINE WORKFLOW
// ============================================================

export type GuardianRelation = 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'SPONSOR' | 'OTHER';

export interface Guardian {
  id: string;
  studentId: string;
  fullName: string;
  relation: GuardianRelation;
  phone: string;
  whatsapp?: string;
  email?: string;
  isPrimary: boolean;
  createdAt: string;
}

export type StageTransitionPayload = Record<string, string | number | boolean | null>;

export interface StageTransition {
  id: string;
  studentId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  triggeredById: string;
  triggeredByName: string;
  triggeredByRole: Role;
  capturedData: StageTransitionPayload;
  notificationsSent: string[];
  notes?: string;
  createdAt: string;
}

export type TravelSubStep = 'passport' | 'visa' | 'flight' | 'arrival';
export type TravelSubStepStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export interface TravelStepStatusMap {
  passport: TravelSubStepStatus;
  visa: TravelSubStepStatus;
  flight: TravelSubStepStatus;
  arrival: TravelSubStepStatus;
}

export type NotifyAudience = 'STUDENT' | 'PARENT_PRIMARY' | 'ALL_PARENTS' | 'NEW_OWNER' | 'TEAM';
export type NotifyChannel = 'WHATSAPP' | 'IN_APP';
