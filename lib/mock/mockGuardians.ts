import { Guardian } from '@/types';

export const mockGuardians: Guardian[] = [
  {
    id: 'gdn_001',
    studentId: 'std_001',
    fullName: 'Mary Doe',
    relation: 'MOTHER',
    phone: '+255712000001',
    whatsapp: '+255712000001',
    email: 'mary.doe@example.com',
    isPrimary: true,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'gdn_002',
    studentId: 'std_001',
    fullName: 'James Doe',
    relation: 'FATHER',
    phone: '+255712000002',
    isPrimary: false,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'gdn_003',
    studentId: 'std_007',
    fullName: 'Victoria Beckham',
    relation: 'MOTHER',
    phone: '+255712000007',
    whatsapp: '+255712000007',
    isPrimary: true,
    createdAt: '2026-01-15T00:00:00Z',
  },
];

export function getGuardiansForStudent(studentId: string): Guardian[] {
  return mockGuardians.filter(g => g.studentId === studentId);
}

export function getPrimaryGuardian(studentId: string): Guardian | undefined {
  return mockGuardians.find(g => g.studentId === studentId && g.isPrimary);
}