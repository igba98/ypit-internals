import { OperationsRecord } from '@/types';

export const mockOperationsRecords: OperationsRecord[] = [
  {
    id: "ops_001",
    studentId: "std_008",
    studentName: "Emma Watson",
    university: "Harvard University",
    country: "USA",
    arrivalDate: "2026-08-26T00:00:00Z",
    enrollmentConfirmed: true,
    enrollmentDate: "2026-09-01T00:00:00Z",
    studentIdNumber: "HVD-2026-001",
    accommodationAddress: "456 Main St, Cambridge, MA",
    localContactName: "John Smith",
    localContactPhone: "+16175551234",
    wellbeingStatus: "GOOD",
    lastCheckIn: "2026-09-15T00:00:00Z",
    checkInCount: 2,
    escalationFlag: false,
    notes: "Settled in well. Attending classes regularly."
  },
  {
    id: "ops_002",
    studentId: "std_009",
    studentName: "Chris Evans",
    university: "MIT",
    country: "USA",
    arrivalDate: "2025-08-25T00:00:00Z",
    enrollmentConfirmed: true,
    enrollmentDate: "2025-09-01T00:00:00Z",
    studentIdNumber: "MIT-2025-009",
    accommodationAddress: "789 Tech Way, Cambridge, MA",
    localContactName: "Jane Doe",
    localContactPhone: "+16175559876",
    wellbeingStatus: "NEEDS_ATTENTION",
    lastCheckIn: "2026-02-20T00:00:00Z",
    checkInCount: 5,
    escalationFlag: true,
    escalationReason: "Reported feeling homesick and struggling with coursework.",
    notes: "Needs follow-up call next week."
  }
];

export function getOperationsByStudentId(studentId: string): OperationsRecord | undefined {
  return mockOperationsRecords.find(o => o.studentId === studentId);
}

export function getEscalatedStudents(): OperationsRecord[] {
  return mockOperationsRecords.filter(o => o.escalationFlag);
}
