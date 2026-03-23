import { Lead } from '@/types';

export const mockLeads: Lead[] = [
  {
    id: "ld_001",
    fullName: "Samuel Ochieng",
    phone: "+254711223344",
    email: "samuel.o@example.com",
    source: "SOCIAL_MEDIA",
    interestedIn: "BSc Computer Science",
    interestedCountry: "UK",
    status: "NEW",
    assignedToId: "usr_008",
    assignedToName: "Linda Owusu",
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-03-20T10:00:00Z",
    notes: "Saw our Instagram ad about UK universities."
  },
  {
    id: "ld_002",
    fullName: "Aisha Mohammed",
    phone: "+255722334455",
    source: "SCHOOL_VISIT",
    interestedIn: "Medicine",
    interestedCountry: "China",
    status: "CONTACTED",
    assignedToId: "usr_008",
    assignedToName: "Linda Owusu",
    createdAt: "2026-03-18T14:30:00Z",
    updatedAt: "2026-03-19T09:15:00Z",
    followUpDate: "2026-03-25T00:00:00Z",
    notes: "Met at Aga Khan Academy career fair. Called her, she wants to discuss with parents."
  },
  {
    id: "ld_003",
    fullName: "Brian Kiprono",
    phone: "+254733445566",
    email: "brian.k@example.com",
    source: "WEBSITE",
    interestedIn: "MBA",
    interestedCountry: "Australia",
    status: "COUNSELED",
    assignedToId: "usr_009",
    assignedToName: "Kevin Dube",
    createdAt: "2026-03-15T11:20:00Z",
    updatedAt: "2026-03-21T16:45:00Z",
    notes: "Had a 1-hour counseling session. Very interested in University of Sydney. Waiting for transcripts."
  },
  {
    id: "ld_004",
    fullName: "Grace Njoroge",
    phone: "+254744556677",
    source: "REFERRAL",
    interestedIn: "Nursing",
    interestedCountry: "Canada",
    status: "CONVERTED",
    assignedToId: "usr_008",
    assignedToName: "Linda Owusu",
    createdAt: "2026-03-10T09:00:00Z",
    updatedAt: "2026-03-22T10:00:00Z",
    convertedStudentId: "std_010",
    notes: "Referred by a current student. Paid agency fee today."
  },
  {
    id: "ld_005",
    fullName: "Peter Wamalwa",
    phone: "+254755667788",
    email: "peter.w@example.com",
    source: "WALK_IN",
    interestedIn: "Engineering",
    interestedCountry: "Malaysia",
    status: "LOST",
    assignedToId: "usr_009",
    assignedToName: "Kevin Dube",
    createdAt: "2026-03-05T15:10:00Z",
    updatedAt: "2026-03-18T11:30:00Z",
    notes: "Decided to study locally due to budget constraints."
  }
];

export function getLeadById(id: string): Lead | undefined {
  return mockLeads.find(l => l.id === id);
}

export function getLeadsByAssignee(userId: string): Lead[] {
  return mockLeads.filter(l => l.assignedToId === userId);
}

export function getLeadsBySource(source: string): Lead[] {
  return mockLeads.filter(l => l.source === source);
}
