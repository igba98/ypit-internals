import { User } from '@/types';

export const mockUsers: User[] = [
  { id: "usr_001", fullName: "Shedrack Masine", email: "director@ypitconsultancies.com", password: "ypit2026", role: "MANAGING_DIRECTOR", department: "Executive", phone: "+255759512804", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_001", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_002", fullName: "Lilian Masine", email: "marketing@ypitconsultancies.com", password: "ypit2026", role: "MARKETING_MANAGER", department: "Marketing & Sales", phone: "+255769227898", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_002", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_003", fullName: "Noel Godson", email: "IT@ypitconsultancies.com", password: "ypit2026", role: "IT_ADMIN", department: "IT", phone: "+255794140200", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_003", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_004", fullName: "Cosmas Cosmas", email: "finance@ypitconsultancies.com", password: "ypit2026", role: "FINANCE", department: "Finance", phone: "+255794130200", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_004", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_005", fullName: "Justice Mwampiki", email: "admission@ypitconsultancies.com", password: "ypit2026", role: "ADMISSIONS", department: "Admissions", phone: "+255748506660", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_005", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_006", fullName: "Wisdom Mwaipape", email: "travel@ypitconsultancies.com", password: "ypit2026", role: "TRAVEL", department: "Travel", phone: "+255761987507", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_006", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_007", fullName: "Lucy Masine", email: "administrator@ypitconsultancies.com", password: "ypit2026", role: "OPERATIONS", department: "Administration", phone: "+255794280200", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_007", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_008", fullName: "Ayoub Mgassa", email: "RO@ypitconsultancies.com", password: "ypit2026", role: "MARKETING_STAFF", department: "Business Development & Events", phone: "+255737325544", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_008", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr_009", fullName: "Kevin Dube", email: "agent@ypitconsultancies.com", password: "ypit2026", role: "SUB_AGENT", department: "Marketing", phone: "+255712000009", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_009", createdAt: "2026-01-05T00:00:00Z" },
  { id: "usr_010", fullName: "Michael Osei", email: "michael.o@ypitconsultancies.com", password: "ypit2026", role: "MARKETING_STAFF", department: "Marketing", phone: "+255712000010", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_010", createdAt: "2026-01-05T00:00:00Z" },
  { id: "usr_011", fullName: "Fatima Noor", email: "fatima.n@ypitconsultancies.com", password: "ypit2026", role: "SUB_AGENT", department: "Marketing", phone: "+255712000011", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_011", createdAt: "2026-01-10T00:00:00Z" },
  { id: "usr_012", fullName: "James Kamau", email: "james.k@ypitconsultancies.com", password: "ypit2026", role: "MARKETING_STAFF", department: "Marketing", phone: "+255712000012", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_012", createdAt: "2026-01-15T00:00:00Z" },
  { id: "usr_013", fullName: "Sofia Garcia", email: "sofia.g@ypitconsultancies.com", password: "ypit2026", role: "SUB_AGENT", department: "Marketing", phone: "+255712000013", status: "ACTIVE", avatar: "https://i.pravatar.cc/150?u=usr_013", createdAt: "2026-01-20T00:00:00Z" }
];

export function findUserByEmail(email: string): User | undefined {
  const target = email.trim().toLowerCase();
  return mockUsers.find(u => u.email.toLowerCase() === target);
}

export function findUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}
