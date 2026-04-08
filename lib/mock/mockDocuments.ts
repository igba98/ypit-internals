import { Document } from '@/types';

export const mockDocuments: Document[] = [
  {
    id: "doc_001",
    studentId: "std_005",
    type: "PASSPORT",
    name: "passport_front.pdf",
    url: "#",
    uploadedAt: "2026-01-15T10:00:00Z",
    uploadedBy: "Michael Johnson",
    verified: true,
  },
  {
    id: "doc_002",
    studentId: "std_005",
    type: "TRANSCRIPT",
    name: "bs_transcript.pdf",
    url: "#",
    uploadedAt: "2026-01-16T11:30:00Z",
    uploadedBy: "Michael Johnson",
    verified: false,
    notes: "Needs notarization"
  },
  {
    id: "doc_003",
    studentId: "std_006",
    type: "PASSPORT",
    name: "passport.jpg",
    url: "#",
    uploadedAt: "2025-12-10T09:15:00Z",
    uploadedBy: "Sarah Connor",
    verified: true,
  },
  {
    id: "doc_004",
    studentId: "std_007",
    type: "OFFER_LETTER",
    name: "oxford_offer.pdf",
    url: "#",
    uploadedAt: "2026-02-05T14:20:00Z",
    uploadedBy: "David Beckham",
    verified: true,
  }
];

export function getDocumentsByStudentId(studentId: string): Document[] {
  return mockDocuments.filter(d => d.studentId === studentId);
}
