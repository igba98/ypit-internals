import { User } from '@/types';

export const mockUsers: User[] = [
  { id: "usr_001", fullName: "David Mwangi", email: "md@ypit.com", password: "ypit2026", role: "MANAGING_DIRECTOR", department: "Executive", phone: "+255712000001", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_001", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_002", fullName: "Sarah Kimani", email: "mm@ypit.com", password: "ypit2026", role: "MARKETING_MANAGER", department: "Marketing", phone: "+255712000002", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_002", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_003", fullName: "James Osei", email: "it@ypit.com", password: "ypit2026", role: "IT_ADMIN", department: "IT", phone: "+255712000003", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_003", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_004", fullName: "Amina Saleh", email: "finance@ypit.com", password: "ypit2026", role: "FINANCE", department: "Finance", phone: "+255712000004", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_004", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_005", fullName: "Peter Njoroge", email: "admissions@ypit.com", password: "ypit2026", role: "ADMISSIONS", department: "Admissions", phone: "+255712000005", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_005", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_006", fullName: "Grace Auma", email: "travel@ypit.com", password: "ypit2026", role: "TRAVEL", department: "Travel", phone: "+255712000006", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_006", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_007", fullName: "Ibrahim Hassan", email: "ops@ypit.com", password: "ypit2026", role: "OPERATIONS", department: "Operations", phone: "+255712000007", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_007", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_008", fullName: "Linda Owusu", email: "marketing@ypit.com", password: "ypit2026", role: "MARKETING_STAFF", department: "Marketing", phone: "+255712000008", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_008", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_009", fullName: "Kevin Dube", email: "agent@ypit.com", password: "ypit2026", role: "SUB_AGENT", department: "Marketing", phone: "+255712000009", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_009", createdAt: "2026-01-01T00:00:00Z" }
];

export function findUserByEmail(email: string): User | undefined {
  return mockUsers.find(u => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}
