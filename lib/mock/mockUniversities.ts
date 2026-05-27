import { University } from '@/types';

export const mockUniversities: University[] = [
  {
    id: 'uni_coventry_london',
    name: 'Coventry University London',
    country: 'United Kingdom',
    city: 'London',
    contactName: 'Admissions Office',
    contactEmail: 'admissions@coventry.ac.uk',
    contactPhone: '+44 20 7946 0958',
    defaultReportingMonths: ['September', 'January'],
    status: 'ACTIVE',
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    id: 'uni_intl_college_dundee',
    name: 'International College Dundee',
    country: 'United Kingdom',
    city: 'Dundee',
    contactName: 'Partnerships',
    contactEmail: 'partners@icdundee.ac.uk',
    contactPhone: '+44 1382 308 080',
    defaultReportingMonths: ['September', 'January', 'May'],
    status: 'ACTIVE',
    createdAt: '2026-01-12T08:00:00Z',
  },
  {
    id: 'uni_oxford_legacy',
    name: 'Oxford Academy Old Partnership',
    country: 'United Kingdom',
    city: 'Oxford',
    status: 'ARCHIVED',
    createdAt: '2025-06-01T08:00:00Z',
  },
];
