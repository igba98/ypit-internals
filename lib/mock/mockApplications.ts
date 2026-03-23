import { Application } from '@/types';

export const mockApplications: Application[] = [
  {
    id: "app_001",
    studentId: "std_005",
    studentName: "Michael Johnson",
    university: "University of Toronto",
    country: "Canada",
    program: "MSc Data Science",
    level: "POSTGRADUATE",
    intake: "Sep 2026",
    submissionDate: "2026-02-01T00:00:00Z",
    status: "UNDER_REVIEW",
    submittedBy: "usr_005",
    updatedAt: "2026-02-15T00:00:00Z"
  },
  {
    id: "app_002",
    studentId: "std_006",
    studentName: "Sarah Connor",
    university: "University of Melbourne",
    country: "Australia",
    program: "BA Arts",
    level: "UNDERGRADUATE",
    intake: "Feb 2027",
    submissionDate: "2026-01-25T00:00:00Z",
    status: "ACCEPTED",
    decisionDate: "2026-02-10T00:00:00Z",
    offerLetterUrl: "https://example.com/offer.pdf",
    submittedBy: "usr_005",
    updatedAt: "2026-02-10T00:00:00Z"
  },
  {
    id: "app_003",
    studentId: "std_007",
    studentName: "David Beckham",
    university: "Oxford University",
    country: "UK",
    program: "MSc Finance",
    level: "POSTGRADUATE",
    intake: "Sep 2026",
    submissionDate: "2026-01-10T00:00:00Z",
    status: "ACCEPTED",
    decisionDate: "2026-02-05T00:00:00Z",
    offerLetterUrl: "https://example.com/offer2.pdf",
    conditionsUrl: "https://example.com/conditions.pdf",
    submittedBy: "usr_005",
    updatedAt: "2026-02-05T00:00:00Z"
  },
  {
    id: "app_004",
    studentId: "std_008",
    studentName: "Emma Watson",
    university: "Harvard University",
    country: "USA",
    program: "BA Literature",
    level: "UNDERGRADUATE",
    intake: "Sep 2026",
    submissionDate: "2025-11-15T00:00:00Z",
    status: "ACCEPTED",
    decisionDate: "2026-01-15T00:00:00Z",
    offerLetterUrl: "https://example.com/offer3.pdf",
    submittedBy: "usr_005",
    updatedAt: "2026-01-15T00:00:00Z"
  },
  {
    id: "app_005",
    studentId: "std_009",
    studentName: "Chris Evans",
    university: "MIT",
    country: "USA",
    program: "MSc Physics",
    level: "POSTGRADUATE",
    intake: "Sep 2025",
    submissionDate: "2025-01-10T00:00:00Z",
    status: "ACCEPTED",
    decisionDate: "2025-03-01T00:00:00Z",
    offerLetterUrl: "https://example.com/offer4.pdf",
    submittedBy: "usr_005",
    updatedAt: "2025-03-01T00:00:00Z"
  }
];

export function getApplicationByStudentId(studentId: string): Application | undefined {
  return mockApplications.find(a => a.studentId === studentId);
}

export function getApplicationsByStatus(status: string): Application[] {
  return mockApplications.filter(a => a.status === status);
}
