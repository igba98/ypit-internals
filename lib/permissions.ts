import { PermissionLevel, PermissionMap, Role, Session } from '@/types';

/**
 * Module registry for assistant permissions — mirrors the backend's
 * `MODULE_KEYS` in src/common/permissions.ts. `href` is the sidebar entry an
 * assistant gets when granted at least VIEW.
 */
export interface ModuleDef {
  key: string;
  label: string;
  description: string;
  /** Which assistant type this module is offered to. */
  audience: ('IT_ASSISTANT' | 'MARKETING_ASSISTANT')[];
  href: string;
  /** Sensitive: unchecked by default and visually flagged. */
  sensitive?: boolean;
}

export const MODULES: ModuleDef[] = [
  { key: 'students', label: 'Students', description: 'Student register and profiles', audience: ['MARKETING_ASSISTANT', 'IT_ASSISTANT'], href: '/students' },
  { key: 'leads', label: 'Leads & Student Leads', description: 'Lead board and student-lead intake', audience: ['MARKETING_ASSISTANT', 'IT_ASSISTANT'], href: '/leads' },
  { key: 'enquiries', label: 'Website Enquiries', description: 'Applications and call bookings from the website', audience: ['MARKETING_ASSISTANT', 'IT_ASSISTANT'], href: '/enquiries' },
  { key: 'communication', label: 'Communication', description: 'SMS / WhatsApp / email campaigns', audience: ['MARKETING_ASSISTANT'], href: '/communication' },
  { key: 'business-dev', label: 'Business Development', description: 'Events and university partnerships', audience: ['MARKETING_ASSISTANT'], href: '/business-development' },
  { key: 'subagents', label: 'Subagents', description: 'Sub-agent contracts and follow-ups', audience: ['MARKETING_ASSISTANT'], href: '/subagents' },
  { key: 'partners', label: 'Schools & Companies', description: 'School and company partnerships', audience: ['MARKETING_ASSISTANT'], href: '/schools' },
  { key: 'mous', label: 'MOUs', description: 'Signed agreements (read-only for most)', audience: ['MARKETING_ASSISTANT'], href: '/mous' },
  { key: 'applications', label: 'Applications', description: 'University applications', audience: ['MARKETING_ASSISTANT'], href: '/applications' },
  { key: 'travel', label: 'Travel', description: 'Visa and travel records', audience: ['MARKETING_ASSISTANT'], href: '/travel' },
  { key: 'monitoring', label: 'Monitoring', description: 'Post-arrival check-ins', audience: ['MARKETING_ASSISTANT'], href: '/monitoring' },
  { key: 'tasks', label: 'Tasks', description: 'Assigned tasks and reports', audience: ['MARKETING_ASSISTANT', 'IT_ASSISTANT'], href: '/tasks' },
  { key: 'reports', label: 'Reports', description: 'Dashboards and printable reports', audience: ['MARKETING_ASSISTANT', 'IT_ASSISTANT'], href: '/reports' },
  { key: 'staff', label: 'Staff Directory', description: 'Employee accounts', audience: ['IT_ASSISTANT'], href: '/staff', sensitive: true },
  { key: 'equipment', label: 'Equipment', description: 'IT asset register', audience: ['IT_ASSISTANT'], href: '/equipment' },
  { key: 'website', label: 'Website Content', description: 'Public website images and text', audience: ['IT_ASSISTANT'], href: '/website-cms' },
  { key: 'vault', label: 'Password Vault', description: 'Company credentials — highly sensitive', audience: ['IT_ASSISTANT'], href: '/it-vault', sensitive: true },
  { key: 'audit', label: 'Audit Logs', description: 'System activity history', audience: ['IT_ASSISTANT'], href: '/audit-logs', sensitive: true },
];

export const ASSISTANT_ROLES: Role[] = ['IT_ASSISTANT', 'MARKETING_ASSISTANT'];

export function isAssistant(role: Role | string | undefined): boolean {
  return role === 'IT_ASSISTANT' || role === 'MARKETING_ASSISTANT';
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
 * matrix grants VIEW on the page's module. Replaces the old
 * `allowedRoles.includes(session.role)` checks.
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

/**
 * Edit gate for buttons/forms: natively-privileged roles keep their existing
 * rules; assistants need EDIT (or FULL for `destructive`).
 */
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
  TRAVEL: 'Travel',
  OPERATIONS: 'Relation Officer (Operations)',
  MARKETING_STAFF: 'Marketing Staff',
  SUB_AGENT: 'Sub Agent',
  BUSINESS_DEVELOPMENT: 'Business Development',
  IT_ASSISTANT: 'IT Assistant / Intern',
  MARKETING_ASSISTANT: 'Marketing Assistant / Intern',
};

/** Roles an actor is allowed to assign when creating / editing staff. */
export function assignableRoles(actorRole: Role | string): Role[] {
  if (actorRole === 'MARKETING_MANAGER') return ['MARKETING_ASSISTANT'];
  return Object.keys(ROLE_LABELS) as Role[];
}
