export const ROLES = {
  MANAGING_DIRECTOR: 'MANAGING_DIRECTOR',
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  IT_ADMIN: 'IT_ADMIN',
  FINANCE: 'FINANCE',
  ADMISSIONS: 'ADMISSIONS',
  TRAVEL: 'TRAVEL',
  OPERATIONS: 'OPERATIONS',
  MARKETING_STAFF: 'MARKETING_STAFF',
  SUB_AGENT: 'SUB_AGENT',
  BUSINESS_DEVELOPMENT: 'BUSINESS_DEVELOPMENT',
  IT_ASSISTANT: 'IT_ASSISTANT',
  MARKETING_ASSISTANT: 'MARKETING_ASSISTANT',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];

/** Assistant accounts: per-module access set by their manager. */
export type PermissionLevel = 'VIEW' | 'EDIT' | 'FULL';
export type PermissionMap = Record<string, PermissionLevel>;

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
  /** Default monthly base salary in TZS - used by payroll generation. */
  baseSalary?: number;
  /** Assistant roles only: manager-set module matrix. */
  permissions?: PermissionMap | null;
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
  /** Present for assistant roles only. */
  permissions?: PermissionMap;
}

export interface Student {
  /** Normalised recruitment country (African recruitment tracking). */
  countryOfOrigin?: string | null;
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
  countryOfOrigin?: string | null;
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
  // Optional student-profile details captured up-front (sub-agent "student form").
  whatsapp?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  dateOfBirth?: string | null;
  targetUniversity?: string | null;
  targetIntake?: string | null;
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

export type DocumentType =
  | 'PASSPORT'
  | 'TRANSCRIPT'
  | 'CERTIFICATE'
  | 'OFFER_LETTER'
  | 'VISA'
  | 'BANK_STATEMENT'
  | 'PHOTO'
  | 'REFERENCE_LETTER'
  | 'OTHER';

export type DocumentStatus = 'UPLOADING' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface Document {
  id: string;
  studentId: string;
  type: DocumentType;
  /** Display label (mock: `name`, backend: `originalName` - UI normalizes). */
  name: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  /** Empty string for backend rows; presigned URL fetched on demand. */
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  /** Derived: true when status === 'VERIFIED'. Kept for backwards-compat. */
  verified: boolean;
  status?: DocumentStatus;
  notes?: string | null;
  rejectionReason?: string | null;
  expiresAt?: string | null;
  reviewedAt?: string | null;
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

// ── Printable Leads & Admissions analytics (PDF report) ───────────

export interface LeadsAnalyticsMonth {
  key: string;
  label: string;
  short: string;
  leads: number;
  converted: number;
  students: number;
  enquiries: number;
}

export interface LeadsAnalytics {
  year: number;
  months: LeadsAnalyticsMonth[];
  bestMonth: { label: string; leads: number; students: number } | null;
  bestStudentMonth: { label: string; students: number } | null;
  totals: {
    leads: number;
    converted: number;
    lost: number;
    open: number;
    students: number;
    enquiries: number;
    conversionRate: number;
    monthlyAverage: number;
  };
  sources: { key: string; count: number }[];
  statuses: { key: string; count: number }[];
  destinations: { key: string; count: number }[];
  enquiryTypes: { key: string; count: number }[];
  agents: {
    name: string;
    leads: number;
    converted: number;
    conversionRate: number;
  }[];
  generatedAt: string;
}

/** A named allowance line on a payslip, e.g. { name: "Transport", amount: 50000 }. */
export interface AllowanceItem {
  name: string;
  amount: number;
}

export interface PayrollEntry {
  id: string;                       // PR-2026-MAR-001
  staffId: string;
  staffName: string;
  staffRole: Role;
  department: string;
  period: string;                   // "March 2026"
  periodStart: string;
  periodEnd: string;
  baseSalary: number;               // Basic salary (before allowances)
  allowanceItems?: AllowanceItem[] | null;
  allowances: number;               // Total of allowance items
  grossSalary: number;              // Basic + allowances
  deductions: number;               // Other deductions (optional)
  tax: number;                      // PAYE — entered by finance
  pension: number;                  // NSSF — auto 10% of gross, editable
  taxableSalary: number;            // Gross − NSSF
  netPay: number;                   // Taxable − PAYE − other deductions
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
// FINANCE PHASE 1 - Catalog & per-student fee ledger
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
  /** Local (Tanzania) vs international - University Management. */
  scope?: 'LOCAL' | 'INTERNATIONAL';
  partnership?: { status: PartnershipStatus; lastContactAt?: string | null } | null;
  _count?: { packages: number; mous: number };
  website?: string | null;
  programsSummary?: string | null;
  scholarshipNotes?: string | null;
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

// ── Phase 9: Cash Book + Bank Reconciliation ────────────────────

export type CashBookEntryType = 'RECEIPT' | 'PAYMENT';

export type CashBookSource =
  | 'STUDENT_PAYMENT'
  | 'FEE_LINE'
  | 'INVOICE'
  | 'EXPENSE'
  | 'PAYROLL'
  | 'PETTY_CASH'
  | 'PIPELINE'
  | 'MANUAL';

export interface CashBookEntry {
  id: string;
  entryNumber: string;              // CB-2026-00001
  date: string;
  type: CashBookEntryType;
  source: CashBookSource;
  description: string;
  reference?: string | null;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  entityId?: string | null;
  entityType?: string | null;
  studentId?: string | null;
  /** Leg of an internal transfer (bank ↔ petty cash) - not income/expense. */
  internal?: boolean;
  reconciled: boolean;
  reconciledAt?: string | null;
  bankStatementRef?: string | null;
  recordedByName: string;
  createdAt: string;
}

export interface CashbookSummary {
  openingBalance: number;
  receiptsTotal: number;
  paymentsTotal: number;
  net: number;
  closingBalance: number;
  bank: { receipts: number; payments: number; net: number };
  cash: { receipts: number; payments: number; net: number };
  unreconciledBankCount: number;
}

export interface BankReconciliation {
  id: string;
  recNumber: string;                // BR-2026-001
  statementDate: string;
  statementBalance: number;
  bookBankBalance: number;
  reconciledTotal: number;
  unreconciledCount: number;
  difference: number;
  notes?: string | null;
  preparedByName: string;
  createdAt: string;
}

// ── Phase 9: Equipment register (IT Admin) ──────────────────────

export type EquipmentCategory =
  | 'LAPTOP'
  | 'DESKTOP'
  | 'PHONE'
  | 'MONITOR'
  | 'PRINTER'
  | 'FURNITURE'
  | 'ACCESSORY'
  | 'VEHICLE'
  | 'OTHER';

export type EquipmentCondition = 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED';

export type EquipmentStatus = 'ASSIGNED' | 'RETURNED' | 'LOST';

export interface EquipmentAssignment {
  id: string;
  assetNumber: string;              // EQ-2026-0001
  staffId: string;
  staffName: string;
  name: string;
  category: EquipmentCategory;
  serialNumber?: string | null;
  description?: string | null;
  conditionOut: EquipmentCondition;
  issuedAt: string;
  issuedByName: string;
  status: EquipmentStatus;
  returnedAt?: string | null;
  conditionIn?: EquipmentCondition | null;
  faultNotes?: string | null;
  receivedByName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface StaffClearance {
  staffId: string;
  staffName: string;
  totalIssued: number;
  outstandingCount: number;
  lostCount: number;
  cleared: boolean;
  outstanding?: EquipmentAssignment[];
}

// ── Phase 9: Sub-agent contracts (Operations) ───────────────────

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface SubAgentContract {
  id: string;
  subAgentId: string;
  status: ContractStatus;
  startDate?: string | null;
  endDate?: string | null;
  signedAt?: string | null;
  studentTarget: number;
  commissionTerms?: string | null;
  notes?: string | null;
  lastFollowUpAt?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubAgentFollowUp {
  id: string;
  contractId: string;
  subAgentId: string;
  notes: string;
  createdByName: string;
  createdAt: string;
}

export interface SubAgentStats {
  studentsRecruited: number;
  studentsTravelled: number;
  studentTarget: number;
  targetProgressPct: number | null;
}

export interface SubAgentSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  contract: SubAgentContract | null;
  stats: SubAgentStats;
}

export interface SubAgentStudentRow {
  id: string;
  registrationNumber: string;
  fullName: string;
  pipelineStage: PipelineStage;
  targetUniversity?: string | null;
  targetCountry?: string | null;
  createdAt: string;
  stageEnteredAt?: string | null;
}

export interface SubAgentDetail extends SubAgentSummary {
  contract: (SubAgentContract & { followUps: SubAgentFollowUp[] }) | null;
  students: SubAgentStudentRow[];
}

// ── Phase 9: Letter templates + Pre-Admission Notices ───────────

export interface LetterTemplate {
  id: string;
  name: string;
  description?: string | null;
  body: string;
  isActive: boolean;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreAdmissionNoticeRow {
  id: string;
  noticeNumber: string;             // PAN-2026-0001
  studentId: string;
  studentName: string;
  templateName: string;
  emailTo: string;
  emailSentAt?: string | null;
  emailError?: string | null;
  whatsappQueued: boolean;
  createdByName: string;
  createdAt: string;
}

export interface PreAdmissionNotice extends PreAdmissionNoticeRow {
  templateId?: string | null;
  data: Record<string, string>;
  renderedHtml: string;
}

// ── Phase 9: Reports overview ───────────────────────────────────

export interface ReportsOverview {
  keyMetrics: {
    totalLeads: number;
    convertedLeads: number;
    activeLeads: number;
    conversionRate: number;
    totalStudents: number;
    travelledStudents: number;
    receiptsYtd: number;
    paymentsYtd: number;
    receivables: number;
    escalations: number;
  };
  pipeline: { stage: PipelineStage; count: number }[];
  destinations: { country: string; count: number }[];
  applications: { status: ApplicationStatus; count: number }[];
  wellbeing: { status: WellbeingStatus; count: number }[];
  monthlyTrend: { month: string; leads: number; students: number; travelled: number }[];
  financeTrend: { month: string; receipts: number; payments: number }[];
  generatedAt: string;
}

// ── Phase 9: Student follow-ups (Relationship Officer) ──────────

export type FollowUpType = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'NOTE';
export type FollowUpOutcome = 'POSITIVE' | 'NEUTRAL' | 'NEEDS_ATTENTION' | 'NO_RESPONSE';

export type FollowUpParty = 'STUDENT' | 'PARENT' | 'UNIVERSITY' | 'INTERNAL';
export type FollowUpActionStatus = 'OPEN' | 'DONE';

export interface StudentFollowUp {
  id: string;
  studentId: string;
  type: FollowUpType;
  outcome: FollowUpOutcome;
  notes: string;
  nextFollowUp?: string | null;
  /** RO chain: who was contacted. */
  party: FollowUpParty;
  contactName?: string | null;
  /** Pending action + owner. Null action = pure log entry. */
  pendingAction?: string | null;
  actionStatus?: FollowUpActionStatus | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  completedAt?: string | null;
  createdByName: string;
  createdAt: string;
  /** Joined on the cross-student board. */
  student?: {
    id: string;
    fullName: string;
    registrationNumber: string;
    pipelineStage: PipelineStage;
    phone: string;
    targetUniversity: string;
  };
}

// ── Phase 9: Website enquiries (public site → back-office) ───────

export type EnquiryType = 'CONTACT' | 'BOOKING' | 'APPLICATION';
export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'ARCHIVED';

export interface WebsiteEnquiry {
  id: string;
  reference: string;                // WEB-2026-0001
  type: EnquiryType;
  fullName: string;
  email: string;
  phone?: string | null;
  topic?: string | null;
  interestedCountry?: string | null;
  message?: string | null;
  preferredDate?: string | null;
  status: EnquiryStatus;
  handledByName?: string | null;
  internalNotes?: string | null;
  convertedLeadId?: string | null;
  convertedStudentId?: string | null;
  /** Extra structured fields from richer forms (apply, booking). */
  extra?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ── Phase 10: Campaigns / Communication (SMS · WhatsApp · Email) ──

export type CampaignChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';
export type CampaignStatus =
  | 'DRAFT'
  | 'SENDING'
  | 'SENT'
  | 'PARTIAL'
  | 'FAILED';

export interface ContactGroup {
  id: string;
  name: string;
  description?: string | null;
  contactCount: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignContact {
  id: string;
  groupId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  relation?: string | null;
  studentName?: string | null;
  createdAt: string;
}

export interface ContactGroupDetail extends ContactGroup {
  contacts: CampaignContact[];
}

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  subject?: string | null;
  message: string;
  groupId: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  sentAt?: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  /** Denormalized — survives group deletion. */
  groupName?: string;
  /** Joined on list. */
  group?: { name: string } | null;
}

/** A row the aggressive importer refused, with the reason why. */
export interface RejectedRow {
  row: number;
  name: string;
  reason: string;
}

export interface ImportResult {
  /** Null when every row was rejected - no group is created in that case. */
  group: { id: string; name: string } | null;
  imported: number;
  rejected: RejectedRow[];
}

// ── Phase 11: Business Development (events + partnerships) ────────

export type BdEventType =
  | 'SCHOOL_VISIT'
  | 'EXPO'
  | 'SEMINAR'
  | 'OPEN_DAY'
  | 'WEBINAR'
  | 'OTHER';
export type BdEventStatus = 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type PartnershipStatus =
  | 'PROSPECT'
  | 'IN_DISCUSSION'
  | 'MOU_SIGNED'
  | 'ACTIVE'
  | 'DORMANT'
  | 'ENDED';

export interface BdEvent {
  id: string;
  name: string;
  type: BdEventType;
  venue?: string | null;
  eventDate: string;
  endDate?: string | null;
  /** TZS. */
  budget?: number | null;
  status: BdEventStatus;
  description?: string | null;
  outcomes?: string | null;
  leadsGenerated: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnershipFollowUp {
  id: string;
  partnershipId: string;
  notes: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface UniversityPartnership {
  id: string;
  universityId: string;
  status: PartnershipStatus;
  commissionTerms?: string | null;
  notes?: string | null;
  lastContactAt?: string | null;
  updatedById?: string | null;
  updatedByName?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: PartnershipFollowUp[];
}

/** One row of the partnerships board: a catalog university + its state. */
export interface PartnershipRow {
  universityId: string;
  name: string;
  country: string;
  city?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  partnership: UniversityPartnership | null;
  mouCount: number;
}

// ── Phase 11: MOU documentation (Finance + CEO only) ──────────────

export type MouStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface Mou {
  id: string;
  title: string;
  universityId?: string | null;
  partnerName: string;
  description?: string | null;
  signedDate?: string | null;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  status: MouStatus;
  storageKey?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedById?: string | null;
  uploadedByName?: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  /** Joined on list/detail. */
  university?: { name: string; country: string } | null;
}

// ── Phase 11: IT Password Vault (IT + CEO only) ───────────────────

export type CredentialCategory =
  | 'EMAIL'
  | 'HOSTING'
  | 'DOMAIN'
  | 'SAAS'
  | 'WIFI'
  | 'SOCIAL_MEDIA'
  | 'OTHER';

/** Secrets are never included - reveal fetches them one at a time. */
export interface CompanyCredential {
  id: string;
  service: string;
  category: CredentialCategory;
  username: string;
  url?: string | null;
  notes?: string | null;
  createdById: string;
  createdByName: string;
  updatedById?: string | null;
  updatedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── System updates batch: Schools & Companies ─────────────────────

export type PartnerKind = 'SCHOOL' | 'COMPANY';
export type PartnerStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'ENDED';
export type PartnerContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface PartnerContract {
  id: string;
  partnerId: string;
  title: string;
  description?: string | null;
  status: PartnerContractStatus;
  signedDate?: string | null;
  startDate?: string | null;
  expiryDate?: string | null;
  storageKey?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedByName?: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerFollowUp {
  id: string;
  partnerId: string;
  notes: string;
  nextActionAt?: string | null;
  createdByName: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  kind: PartnerKind;
  name: string;
  category?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  website?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  status: PartnerStatus;
  startDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  lastContactAt?: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  /** List view: light contract summary. Detail view: full rows. */
  contracts?: Pick<PartnerContract, 'id' | 'status' | 'expiryDate'>[] | PartnerContract[];
  followUps?: PartnerFollowUp[];
  _count?: { followUps: number };
}

// ── System updates batch: new printable reports ───────────────────

export interface RecruitmentReport {
  year: number;
  months: { key: string; label: string; short: string; students: number; leads: number }[];
  countries: {
    country: string;
    students: number;
    leads: number;
    travelled: number;
    leadsConverted: number;
    byMonth: number[];
  }[];
  activities: { country: string; events: number; leadsGenerated: number }[];
  topCountry: { country: string; students: number } | null;
  totals: { students: number; leads: number; countries: number; unspecified: number; events: number };
  generatedAt: string;
}

export interface SubagentReport {
  year: number;
  months: { key: string; label: string; short: string; students: number }[];
  agents: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    contractStatus: string | null;
    contractEnd?: string | null;
    commissionTerms?: string | null;
    studentTarget: number;
    leads: number;
    leadsConverted: number;
    students: number;
    travelled: number;
    progressPct: number | null;
  }[];
  topAgent: { name: string; students: number } | null;
  totals: { agents: number; activeContracts: number; students: number; travelled: number; leads: number };
  generatedAt: string;
}
