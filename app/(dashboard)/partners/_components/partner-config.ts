import { PartnerKind, PartnerStatus, PartnerContractStatus } from '@/types';

/** Copy + routing per partner kind. One module, two menus. */
export const PARTNER_KIND: Record<
  PartnerKind,
  {
    singular: string;
    plural: string;
    base: string;
    categoryLabel: string;
    categoryHint: string;
    pageTitle: string;
    pageDescription: string;
  }
> = {
  SCHOOL: {
    singular: 'School',
    plural: 'Schools',
    base: '/schools',
    categoryLabel: 'School type / level',
    categoryHint: 'e.g. Secondary (A-level), International school',
    pageTitle: 'School Management & Contracts',
    pageDescription:
      'Feeder schools YPIT partners with - profiles, partnership status, and the signed agreements behind each one.',
  },
  COMPANY: {
    singular: 'Company',
    plural: 'Companies',
    base: '/companies',
    categoryLabel: 'Type of collaboration',
    categoryHint: 'e.g. Sponsorship, Internship placement, Referral partner',
    pageTitle: 'Company Collaborations',
    pageDescription:
      'External companies YPIT works with - contact people, agreement terms, and follow-up activity.',
  },
};

export const PARTNER_STATUS: { value: PartnerStatus; label: string; badge: string }[] = [
  { value: 'PROSPECT', label: 'Prospect', badge: 'bg-gray-100 text-gray-600' },
  { value: 'ACTIVE', label: 'Active', badge: 'bg-green-100 text-green-800' },
  { value: 'INACTIVE', label: 'Inactive', badge: 'bg-amber-100 text-amber-800' },
  { value: 'ENDED', label: 'Ended', badge: 'bg-red-100 text-red-700' },
];

export const CONTRACT_STATUS: { value: PartnerContractStatus; label: string; badge: string }[] = [
  { value: 'DRAFT', label: 'Draft', badge: 'bg-gray-100 text-gray-600' },
  { value: 'ACTIVE', label: 'Active', badge: 'bg-green-100 text-green-800' },
  { value: 'EXPIRED', label: 'Expired', badge: 'bg-amber-100 text-amber-800' },
  { value: 'TERMINATED', label: 'Terminated', badge: 'bg-red-100 text-red-700' },
];

export const EXPIRY_WARN_DAYS = 60;

export function statusBadge(status: PartnerStatus): string {
  return PARTNER_STATUS.find((s) => s.value === status)?.badge ?? '';
}
export function contractBadge(status: PartnerContractStatus): string {
  return CONTRACT_STATUS.find((s) => s.value === status)?.badge ?? '';
}
