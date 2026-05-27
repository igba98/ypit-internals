import { Package } from '@/types';

export const mockPackages: Package[] = [
  {
    id: 'pkg_coventry_bachelor_business',
    universityId: 'uni_coventry_london',
    name: 'Bachelor — Business Management',
    studyLevel: 'BACHELOR',
    program: 'Business Management',
    description: '3-year undergraduate program in London.',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-08T08:00:00Z',
    updatedAt: '2026-01-08T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_200_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 12_500, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
      { type: 'HOSTEL',      amount: 6_000, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: false },
    ],
  },
  {
    id: 'pkg_coventry_bachelor_cs',
    universityId: 'uni_coventry_london',
    name: 'Bachelor — Computer Science',
    studyLevel: 'BACHELOR',
    program: 'Computer Science',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-08T08:00:00Z',
    updatedAt: '2026-01-08T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_200_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 13_000, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
      { type: 'HOSTEL',      amount: 6_000, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: false },
    ],
  },
  {
    id: 'pkg_coventry_masters_mba',
    universityId: 'uni_coventry_london',
    name: 'Masters — MBA',
    studyLevel: 'MASTERS',
    program: 'Master of Business Administration',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-09T08:00:00Z',
    updatedAt: '2026-01-09T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_500_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 15_000, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
    ],
  },
  {
    id: 'pkg_dundee_foundation_pharma',
    universityId: 'uni_intl_college_dundee',
    name: 'Foundation — Pharmacology',
    studyLevel: 'FOUNDATION',
    program: 'Pharmacology',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'DEPOSIT',     amount: 500, currency: 'GBP', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_000_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 8_500, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
    ],
  },
  {
    id: 'pkg_dundee_foundation_mech',
    universityId: 'uni_intl_college_dundee',
    name: 'Foundation — Mechanical Engineering',
    studyLevel: 'FOUNDATION',
    program: 'Mechanical Engineering',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'DEPOSIT',     amount: 500, currency: 'GBP', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_000_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 8_500, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
    ],
  },
  {
    id: 'pkg_dundee_foundation_compeng',
    universityId: 'uni_intl_college_dundee',
    name: 'Foundation — Computer Engineering',
    studyLevel: 'FOUNDATION',
    program: 'Computer Engineering',
    status: 'ACTIVE',
    createdByName: 'Finance',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
    feeDefaults: [
      { type: 'APPLICATION', amount: 500, currency: 'USD', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'DEPOSIT',     amount: 500, currency: 'GBP', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
      { type: 'AGENCY',      amount: 1_000_000, currency: 'TZS', dueRule: { kind: 'DAYS_FROM_ENROLLMENT', days: 30 }, required: true },
      { type: 'TUITION',     amount: 8_500, currency: 'GBP', dueRule: { kind: 'BEFORE_REPORTING_DATE', days: 0 }, required: true },
    ],
  },
];

export function getActivePackagesForUniversity(universityId: string): Package[] {
  return mockPackages.filter(p => p.universityId === universityId && p.status === 'ACTIVE');
}

export function getPackageById(packageId: string): Package | undefined {
  return mockPackages.find(p => p.id === packageId);
}
