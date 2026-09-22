import { PermissionLevel, PermissionMap, Role, Session } from '@/types';

/**
 * Module registry for assistant permissions — mirrors the backend's
 * `MODULE_KEYS` in src/common/permissions.ts. `hrefs` are the sidebar entries
 * an assistant gets when granted at least VIEW.
 */
export interface ModuleDef {
  key: string;
  label: string;
  description: string;
  hrefs: { label: string; href: string }[];
  /** Sensitive: visually flagged in the matrix. */
  sensitive?: boolean;
}

export const MODULES: ModuleDef[] = [
  { key: 'students', label: 'Students & Follow-ups', description: 'Student register, profiles, follow-up board', hrefs: [{ label: 'Students', href: '/students' }, { label: 'Follow-ups', href: '/follow-ups' }] },
  { key: 'leads', label: 'Leads & Student Leads', description: 'Lead board and student-lead intake', hrefs: [{ label: 'Leads', href: '/leads' }, { label: 'Student Leads', href: '/student-leads' }] },
  { key: 'enquiries', label: 'Website Enquiries', description: 'Applications and call bookings from the website', hrefs: [{ label: 'Enquiries', href: '/enquiries' }] },
  { key: 'communication', label: 'Communication', description: 'SMS / WhatsApp / email campaigns', hrefs: [{ label: 'Communication', href: '/communication' }] },
  { key: 'business-dev', label: 'Business Development', description: 'Events and university partnerships', hrefs: [{ label: 'Business Dev', href: '/business-development' }] },
  { key: 'catalog', label: 'Universities & Packages', description: 'University management and fee packages', hrefs: [{ label: 'Universities', href: '/universities' }] },
  { key: 'subagents', label: 'Subagents', description: 'Sub-agent contracts and follow-ups', hrefs: [{ label: 'Subagents', href: '/subagents' }] },
  { key: 'partners', label: 'Schools & Companies', description: 'School and company partnerships, contracts', hrefs: [{ label: 'Schools & Contracts', href: '/schools' }, { label: 'Company Collaborations', href: '/companies' }] },
  { key: 'mous', label: 'MOUs', description: 'Signed agreements with universities', hrefs: [{ label: 'MOUs', href: '/mous' }] },
  { key: 'applications', label: 'Applications', description: 'University applications', hrefs: [{ label: 'Applications', href: '/applications' }] },
  { key: 'letters', label: 'Admission Letters', description: 'Pre-admission notices and letters', hrefs: [{ label: 'Admission Letters', href: '/admission-letters' }] },
  { key: 'travel', label: 'Travel', description: 'Visa and travel records', hrefs: [{ label: 'Travel', href: '/travel' }] },
  { key: 'monitoring', label: 'Monitoring', description: 'Post-arrival check-ins and pipeline health', hrefs: [{ label: 'Monitoring', href: '/monitoring' }, { label: 'Pipeline Health', href: '/pipeline-health' }] },
  { key: 'finance', label: 'Finance', description: 'Cash book, invoices, expenses, payroll, petty cash, student payments', hrefs: [{ label: 'Finance Hub', href: '/finance' }, { label: 'Student Payments', href: '/payments' }], sensitive: true },
  { key: 'tasks', label: 'Tasks', description: 'Assigned tasks and reports', hrefs: [{ label: 'Tasks', href: '/tasks' }] },
  { key: 'reports', label: 'Reports', description: 'Dashboards and printable reports', hrefs: [{ label: 'Reports', href: '/reports' }] },
  { key: 'staff', label: 'Staff Directory', description: 'Employee accounts', hrefs: [{ label: 'Staff', href: '/staff' }], sensitive: true },
  { key: 'equipment', label: 'Equipment', description: 'IT asset register', hrefs: [{ label: 'Equipment', href: '/equipment' }] },
  { key: 'website', label: 'Website Content', description: 'Public website images and text', hrefs: [{ label: 'Website Content', href: '/website-cms' }] },
  { key: 'vault', label: 'Password Vault', description: 'Company credentials — highly sensitive', hrefs: [{ label: 'Password Vault', href: '/it-vault' }], sensitive: true },
  { key: 'audit', label: 'Audit Logs', description: 'System activity history', hrefs: [{ label: 'Audit Logs', href: '/audit-logs' }], sensitive: true },
  { key: 'documents', label: 'Student Documents', description: 'Review and verify uploaded student documents', hrefs: [{ label: 'Student Documents', href: '/documents' }] },
  { key: 'commissions', label: 'University Commissions', description: 'Commissions owed and received from universities', hrefs: [{ label: 'Commissions', href: '/commissions' }], sensitive: true },
  { key: 'assets', label: 'Company Assets', description: 'Company-wide asset register', hrefs: [{ label: 'Company Assets', href: '/assets' }] },
  { key: 'records', label: 'Company Records', description: 'Company documents and personnel files (employees, interns, field)', hrefs: [{ label: 'Company Records', href: '/records' }], sensitive: true },
];

/**
 * Which modules each main role works in. An assistant is offered exactly its
 * parent role's modules — "just like the main role" — and the manager narrows.
 */
export const ROLE_MODULES: Partial<Record<Role, string[]>> = {
  IT_ADMIN: ['leads', 'enquiries', 'staff', 'equipment', 'website', 'vault', 'audit', 'tasks', 'reports'],
  MARKETING_MANAGER: ['students', 'leads', 'enquiries', 'communication', 'business-dev', 'catalog', 'subagents', 'partners', 'commissions', 'applications', 'letters', 'travel', 'monitoring', 'tasks', 'reports'],
  // Relations Officers (renamed from Marketing Staff) - travel folded in.
  MARKETING_STAFF: ['students', 'leads', 'enquiries', 'communication', 'travel', 'tasks', 'reports'],
  TRAVEL: ['students', 'leads', 'travel', 'applications', 'letters', 'tasks', 'reports'],
  FINANCE: ['students', 'finance', 'catalog', 'mous', 'partners', 'commissions', 'tasks', 'reports'],
  ADMISSIONS: ['students', 'applications', 'documents', 'letters', 'catalog', 'travel', 'monitoring', 'tasks', 'reports'],
  // Administrator (formerly Operations).
  OPERATIONS: ['assets', 'records', 'equipment', 'staff', 'monitoring', 'tasks', 'reports'],
  BUSINESS_DEVELOPMENT: ['business-dev', 'subagents', 'partners', 'catalog', 'mous', 'commissions', 'tasks', 'reports'],
};

/** assistant role → the main role it shadows. Every role except MD / sub-agent. */
export const ASSISTANT_PARENT: Partial<Record<Role, Role>> = {
  IT_ASSISTANT: 'IT_ADMIN',
  MARKETING_ASSISTANT: 'MARKETING_MANAGER',
  FINANCE_ASSISTANT: 'FINANCE',
  ADMISSIONS_ASSISTANT: 'ADMISSIONS',
  TRAVEL_ASSISTANT: 'TRAVEL',
  OPERATIONS_ASSISTANT: 'OPERATIONS',
  MARKETING_STAFF_ASSISTANT: 'MARKETING_STAFF',
  BUSINESS_DEVELOPMENT_ASSISTANT: 'BUSINESS_DEVELOPMENT',
};

export function isAssistant(role: Role | string | undefined): boolean {
  return Boolean(role && role in ASSISTANT_PARENT);
}

/** Which assistant role a main role manages (null for MD / sub-agents / assistants). */
export function assistantRoleFor(mainRole: Role | string): Role | null {
  for (const [assistant, parent] of Object.entries(ASSISTANT_PARENT)) {
    if (parent === mainRole) return assistant as Role;
  }
  return null;
}

/** Modules offered to an assistant type = its parent's modules. */
export function modulesForAssistant(assistantRole: Role | string): ModuleDef[] {
  const parent = ASSISTANT_PARENT[assistantRole as Role];
  const keys = parent ? (ROLE_MODULES[parent] ?? []) : [];
  return MODULES.filter((m) => keys.includes(m.key));
}

const RANK: Record<PermissionLevel, number> = { VIEW: 1, EDIT: 2, FULL: 3 };

/** Does this session have at least `level` on `moduleKey`? (assistants only) */
export function can(
  session: Pick<Session, 'role' | 'permissions'> | null | undefined,
  moduleKey: string,
  level: PermissionLevel = 'VIEW',
): boolean {
  if (!session) return false;
  if (session.role === 'MANAGING_DIRECTOR') return true;
  if (!isAssistant(session.role)) return false;
  const granted = session.permissions?.[moduleKey];
  return granted ? RANK[granted] >= RANK[level] : false;
}

/**
 * Page gate: the role is natively allowed, OR the MD, OR an assistant whose
 * matrix grants VIEW on the page's module.
 */
export function pageAllowed(
  session: { role: string; permissions?: PermissionMap } | null | undefined,
  moduleKey: string,
  allowedRoles: readonly string[],
): boolean {
  if (!session) return false;
  if (session.role === 'MANAGING_DIRECTOR') return true;
  if (allowedRoles.includes(session.role)) return true;
  return can(session as Pick<Session, 'role' | 'permissions'>, moduleKey, 'VIEW');
}

/** Edit gate for buttons/forms: assistants need EDIT (or FULL for `destructive`). */
export function canEdit(
  session: Pick<Session, 'role' | 'permissions'> | null | undefined,
  moduleKey: string,
  nativeRoles: readonly string[],
  destructive = false,
): boolean {
  if (!session) return false;
  if (session.role === 'MANAGING_DIRECTOR') return true;
  if (nativeRoles.includes(session.role)) return true;
  return can(session, moduleKey, destructive ? 'FULL' : 'EDIT');
}

export const ROLE_LABELS: Record<Role, string> = {
  MANAGING_DIRECTOR: 'Managing Director',
  MARKETING_MANAGER: 'Marketing Manager',
  IT_ADMIN: 'IT Admin',
  FINANCE: 'Finance',
  ADMISSIONS: 'Admissions',
  // System updates 2.0: Marketing → Relations Officer; Travel folded into RO;
  // Operations → Administrator. Enum values unchanged, only the names.
  TRAVEL: 'Relations Officer (Travel)',
  OPERATIONS: 'Administrator',
  MARKETING_STAFF: 'Relations Officer (RO)',
  SUB_AGENT: 'Sub Agent',
  BUSINESS_DEVELOPMENT: 'Business Development',
  IT_ASSISTANT: 'IT Assistant',
  MARKETING_ASSISTANT: 'Marketing Manager Assistant',
  FINANCE_ASSISTANT: 'Finance Assistant',
  ADMISSIONS_ASSISTANT: 'Admissions Assistant',
  TRAVEL_ASSISTANT: 'RO (Travel) Assistant',
  OPERATIONS_ASSISTANT: 'Administrator Assistant',
  MARKETING_STAFF_ASSISTANT: 'RO Assistant',
  BUSINESS_DEVELOPMENT_ASSISTANT: 'Business Development Assistant',
};

/** Relations Officers work only their own book of leads and students. */
export const RO_ROLES: string[] = ['MARKETING_STAFF', 'TRAVEL', 'MARKETING_STAFF_ASSISTANT', 'TRAVEL_ASSISTANT'];
export function isRO(role: string | undefined): boolean {
  return Boolean(role && RO_ROLES.includes(role));
}

/** Who may hand leads to ROs (system updates 2.0 §1). */
export const LEAD_DISTRIBUTOR_ROLES: string[] = ['IT_ADMIN', 'MARKETING_MANAGER', 'MANAGING_DIRECTOR'];

/** Roles an actor may assign when creating / editing staff. */
export function assignableRoles(actorRole: Role | string): Role[] {
  if (actorRole === 'IT_ADMIN' || actorRole === 'MANAGING_DIRECTOR') {
    return Object.keys(ROLE_LABELS) as Role[];
  }
  const own = assistantRoleFor(actorRole);
  const roles: Role[] = own ? [own] : [];
  // Business Development (and the Marketing Manager) recruit sub-agents.
  if (actorRole === 'BUSINESS_DEVELOPMENT' || actorRole === 'MARKETING_MANAGER') roles.push('SUB_AGENT');
  return roles;
}

/** Roles that can open the Staff page (to manage at least their own assistants). */
export const STAFF_PAGE_ROLES: string[] = [
  'MANAGING_DIRECTOR', 'IT_ADMIN', 'MARKETING_MANAGER', 'MARKETING_STAFF', 'FINANCE',
  'ADMISSIONS', 'TRAVEL', 'OPERATIONS', 'BUSINESS_DEVELOPMENT',
];
