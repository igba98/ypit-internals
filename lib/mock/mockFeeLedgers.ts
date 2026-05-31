import { StudentFeeLedger } from '@/types';

/**
 * Phase 1 seed data.
 *
 * Entries 1-12 are 1:1 migrations of the legacy `mockPayments.ts` records,
 * EXCEPT for records belonging to std_001, std_002, std_005 - those get fresh
 * package-driven ledgers below. Migration follows rules captured in
 * docs/superpowers/specs/2026-05-26-finance-phase-1-fee-structures-and-packages-design.md
 *
 * Entries 13-15 exercise the new package-driven flow.
 */
export const mockFeeLedgers: StudentFeeLedger[] = [
  {
  "studentId": "std_003",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_001_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1000000,
      "currency": "TZS",
      "dueDate": "2026-03-12T00:00:00.000Z",
      "paidAmount": 500000,
      "status": "PARTIAL"
    },
    {
      "id": "fl_pay_001_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 500000,
      "currency": "TZS",
      "dueDate": "2026-03-12T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_001_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 15000000,
      "currency": "TZS",
      "dueDate": "2026-05-11T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_001_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 5000000,
      "currency": "TZS",
      "dueDate": "2026-05-11T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    }
  ],
  "createdAt": "2026-02-10T00:00:00Z",
  "updatedAt": "2026-02-10T00:00:00Z"
},
{
  "studentId": "std_004",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_002_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1200000,
      "currency": "TZS",
      "dueDate": "2026-03-07T00:00:00.000Z",
      "paidAmount": 1200000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_002_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 600000,
      "currency": "TZS",
      "dueDate": "2026-03-07T00:00:00.000Z",
      "paidAmount": 600000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_002_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 18000000,
      "currency": "TZS",
      "dueDate": "2026-05-06T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_002_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 6000000,
      "currency": "TZS",
      "dueDate": "2026-05-06T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    }
  ],
  "createdAt": "2026-02-05T00:00:00Z",
  "updatedAt": "2026-02-05T00:00:00Z"
},
{
  "studentId": "std_006",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_003_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1500000,
      "currency": "TZS",
      "dueDate": "2026-04-09T00:00:00.000Z",
      "paidAmount": 1500000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_003_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 800000,
      "currency": "TZS",
      "dueDate": "2026-04-09T00:00:00.000Z",
      "paidAmount": 800000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_003_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 25000000,
      "currency": "TZS",
      "dueDate": "2026-06-08T00:00:00.000Z",
      "paidAmount": 12500000,
      "status": "PARTIAL"
    },
    {
      "id": "fl_pay_003_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 8000000,
      "currency": "TZS",
      "dueDate": "2026-06-08T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    }
  ],
  "createdAt": "2026-03-10T00:00:00Z",
  "updatedAt": "2026-03-10T00:00:00Z"
},
{
  "studentId": "std_008",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_004_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1500000,
      "currency": "TZS",
      "dueDate": "2026-03-31T00:00:00.000Z",
      "paidAmount": 1500000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_004_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 800000,
      "currency": "TZS",
      "dueDate": "2026-03-31T00:00:00.000Z",
      "paidAmount": 800000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_004_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 20000000,
      "currency": "TZS",
      "dueDate": "2026-05-30T00:00:00.000Z",
      "paidAmount": 20000000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_004_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 7000000,
      "currency": "TZS",
      "dueDate": "2026-05-30T00:00:00.000Z",
      "paidAmount": 7000000,
      "status": "PAID"
    }
  ],
  "createdAt": "2026-03-01T00:00:00Z",
  "updatedAt": "2026-03-01T00:00:00Z"
},
{
  "studentId": "std_007",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_008_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1800000,
      "currency": "TZS",
      "dueDate": "2026-03-30T00:00:00.000Z",
      "paidAmount": 1800000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_008_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 900000,
      "currency": "TZS",
      "dueDate": "2026-03-30T00:00:00.000Z",
      "paidAmount": 900000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_008_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 32000000,
      "currency": "TZS",
      "dueDate": "2026-05-29T00:00:00.000Z",
      "paidAmount": 16000000,
      "status": "PARTIAL"
    },
    {
      "id": "fl_pay_008_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 9000000,
      "currency": "TZS",
      "dueDate": "2026-05-29T00:00:00.000Z",
      "paidAmount": 4500000,
      "status": "PARTIAL"
    }
  ],
  "createdAt": "2026-02-28T00:00:00Z",
  "updatedAt": "2026-02-28T00:00:00Z"
},
{
  "studentId": "std_009",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_009_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1500000,
      "currency": "TZS",
      "dueDate": "2025-08-31T00:00:00.000Z",
      "paidAmount": 1500000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_009_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 800000,
      "currency": "TZS",
      "dueDate": "2025-08-31T00:00:00.000Z",
      "paidAmount": 800000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_009_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 35000000,
      "currency": "TZS",
      "dueDate": "2025-10-30T00:00:00.000Z",
      "paidAmount": 35000000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_009_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 10000000,
      "currency": "TZS",
      "dueDate": "2025-10-30T00:00:00.000Z",
      "paidAmount": 10000000,
      "status": "PAID"
    }
  ],
  "createdAt": "2025-08-01T00:00:00Z",
  "updatedAt": "2025-08-01T00:00:00Z"
},
{
  "studentId": "std_010",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_010_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1300000,
      "currency": "TZS",
      "dueDate": "2026-04-07T00:00:00.000Z",
      "paidAmount": 1300000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_010_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 700000,
      "currency": "TZS",
      "dueDate": "2026-04-07T00:00:00.000Z",
      "paidAmount": 700000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_010_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 24000000,
      "currency": "TZS",
      "dueDate": "2026-06-06T00:00:00.000Z",
      "paidAmount": 6000000,
      "status": "PARTIAL"
    },
    {
      "id": "fl_pay_010_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 7500000,
      "currency": "TZS",
      "dueDate": "2026-06-06T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    }
  ],
  "createdAt": "2026-03-08T00:00:00Z",
  "updatedAt": "2026-03-08T00:00:00Z"
},
{
  "studentId": "std_011",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_011_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1100000,
      "currency": "TZS",
      "dueDate": "2026-02-14T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_011_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 550000,
      "currency": "TZS",
      "dueDate": "2026-02-14T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_011_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 19000000,
      "currency": "TZS",
      "dueDate": "2026-04-15T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_011_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 6500000,
      "currency": "TZS",
      "dueDate": "2026-04-15T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    }
  ],
  "createdAt": "2026-01-15T00:00:00Z",
  "updatedAt": "2026-01-15T00:00:00Z"
},
{
  "studentId": "std_012",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_012_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1400000,
      "currency": "TZS",
      "dueDate": "2025-12-31T00:00:00.000Z",
      "paidAmount": 1400000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_012_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 750000,
      "currency": "TZS",
      "dueDate": "2025-12-31T00:00:00.000Z",
      "paidAmount": 750000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_012_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 26000000,
      "currency": "TZS",
      "dueDate": "2026-03-01T00:00:00.000Z",
      "paidAmount": 26000000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_012_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 8500000,
      "currency": "TZS",
      "dueDate": "2026-03-01T00:00:00.000Z",
      "paidAmount": 8500000,
      "status": "PAID"
    }
  ],
  "createdAt": "2025-12-01T00:00:00Z",
  "updatedAt": "2025-12-01T00:00:00Z"
},
{
  "studentId": "std_013",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_013_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1200000,
      "currency": "TZS",
      "dueDate": "2026-04-09T00:00:00.000Z",
      "paidAmount": 1200000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_013_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 600000,
      "currency": "TZS",
      "dueDate": "2026-04-09T00:00:00.000Z",
      "paidAmount": 600000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_013_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 17000000,
      "currency": "TZS",
      "dueDate": "2026-06-08T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_013_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 5800000,
      "currency": "TZS",
      "dueDate": "2026-06-08T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    }
  ],
  "createdAt": "2026-03-10T00:00:00Z",
  "updatedAt": "2026-03-10T00:00:00Z"
},
{
  "studentId": "std_014",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_014_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1100000,
      "currency": "TZS",
      "dueDate": "2026-03-17T00:00:00.000Z",
      "paidAmount": 1100000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_014_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 600000,
      "currency": "TZS",
      "dueDate": "2026-03-17T00:00:00.000Z",
      "paidAmount": 600000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_014_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 14000000,
      "currency": "TZS",
      "dueDate": "2026-05-16T00:00:00.000Z",
      "paidAmount": 14000000,
      "status": "PAID"
    },
    {
      "id": "fl_pay_014_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 5000000,
      "currency": "TZS",
      "dueDate": "2026-05-16T00:00:00.000Z",
      "paidAmount": 2500000,
      "status": "PARTIAL"
    }
  ],
  "createdAt": "2026-02-15T00:00:00Z",
  "updatedAt": "2026-02-15T00:00:00Z"
},
{
  "studentId": "std_015",
  "currencyDisplay": "TZS",
  "lines": [
    {
      "id": "fl_pay_015_agency",
      "type": "AGENCY",
      "label": "Agency Fee",
      "amount": 1000000,
      "currency": "TZS",
      "dueDate": "2026-02-14T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_015_application",
      "type": "APPLICATION",
      "label": "Application Fee",
      "amount": 500000,
      "currency": "TZS",
      "dueDate": "2026-02-14T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_015_tuition",
      "type": "TUITION",
      "label": "Tuition",
      "amount": 20000000,
      "currency": "TZS",
      "dueDate": "2026-04-15T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    },
    {
      "id": "fl_pay_015_hostel",
      "type": "HOSTEL",
      "label": "Accommodation",
      "amount": 6500000,
      "currency": "TZS",
      "dueDate": "2026-04-15T00:00:00.000Z",
      "paidAmount": 0,
      "status": "UNPAID"
    }
  ],
  "createdAt": "2026-01-15T00:00:00Z",
  "updatedAt": "2026-01-15T00:00:00Z"
},

  // ---- Fresh ledger 1: brand new enrollment via Coventry Business package (std_001) ----
  {
    studentId: 'std_001',
    packageId: 'pkg_coventry_bachelor_business',
    currencyDisplay: 'TZS',
    createdAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-04-10T09:00:00Z',
    lines: [
      { id: 'fl_pkg_001_app',     type: 'APPLICATION', label: 'Application Fee', amount: 500,       currency: 'USD', dueDate: '2026-04-10T09:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 0 },
      { id: 'fl_pkg_001_agency',  type: 'AGENCY',      label: 'Agency Fee',      amount: 1_200_000, currency: 'TZS', dueDate: '2026-05-10T09:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 1 },
      { id: 'fl_pkg_001_tuition', type: 'TUITION',     label: 'Tuition',         amount: 12_500,    currency: 'GBP', dueDate: '2026-09-01T00:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 2 },
      { id: 'fl_pkg_001_hostel',  type: 'HOSTEL',      label: 'Accommodation',   amount: 6_000,     currency: 'GBP', dueDate: '2026-09-01T00:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 3 },
    ],
  },
  // ---- Fresh ledger 2: PARTIAL mixed-currency (std_002) ----
  {
    studentId: 'std_002',
    packageId: 'pkg_dundee_foundation_pharma',
    currencyDisplay: 'TZS',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-04-20T08:00:00Z',
    lines: [
      { id: 'fl_pkg_002_app',     type: 'APPLICATION', label: 'Application Fee', amount: 500,       currency: 'USD', dueDate: '2026-03-15T08:00:00Z', paidAmount: 500,       status: 'PAID',    sourceFeeDefaultIndex: 0 },
      { id: 'fl_pkg_002_deposit', type: 'DEPOSIT',     label: 'Deposit',         amount: 500,       currency: 'GBP', dueDate: '2026-03-15T08:00:00Z', paidAmount: 500,       status: 'PAID',    sourceFeeDefaultIndex: 1 },
      { id: 'fl_pkg_002_agency',  type: 'AGENCY',      label: 'Agency Fee',      amount: 1_000_000, currency: 'TZS', dueDate: '2026-04-14T08:00:00Z', paidAmount: 1_000_000, status: 'PAID',    sourceFeeDefaultIndex: 2 },
      { id: 'fl_pkg_002_tuition', type: 'TUITION',     label: 'Tuition',         amount: 8_500,     currency: 'GBP', dueDate: '2026-09-01T00:00:00Z', paidAmount: 2_000,     status: 'PARTIAL', sourceFeeDefaultIndex: 3 },
    ],
  },
  // ---- Fresh ledger 3: OVERRIDE applied - scholarship (std_005) ----
  {
    studentId: 'std_005',
    packageId: 'pkg_coventry_bachelor_cs',
    currencyDisplay: 'TZS',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
    lines: [
      { id: 'fl_pkg_003_app',     type: 'APPLICATION', label: 'Application Fee', amount: 500,       currency: 'USD', dueDate: '2026-04-01T08:00:00Z', paidAmount: 500, status: 'PAID',   sourceFeeDefaultIndex: 0 },
      { id: 'fl_pkg_003_agency',  type: 'AGENCY',      label: 'Agency Fee',      amount: 1_200_000, currency: 'TZS', dueDate: '2026-05-01T08:00:00Z', paidAmount: 0,   status: 'UNPAID', sourceFeeDefaultIndex: 1 },
      {
        id: 'fl_pkg_003_tuition', type: 'TUITION', label: 'Tuition', amount: 11_700, currency: 'GBP',
        dueDate: '2026-09-01T00:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 2,
        overrideReason: '10% scholarship - academic merit',
        overriddenById: 'usr_004',
        overriddenByName: 'Esther (Finance)',
        overriddenAt: '2026-04-15T10:00:00Z',
      },
      { id: 'fl_pkg_003_hostel', type: 'HOSTEL', label: 'Accommodation', amount: 6_000, currency: 'GBP', dueDate: '2026-09-01T00:00:00Z', paidAmount: 0, status: 'UNPAID', sourceFeeDefaultIndex: 3 },
    ],
  },
];

/** Find the ledger for a given student. */
export function getFeeLedgerForStudent(studentId: string): StudentFeeLedger | undefined {
  return mockFeeLedgers.find(l => l.studentId === studentId);
}
