import { Document } from '@/types';

export const mockDocuments: Document[] = [
  // std_001 - John Doe (LEAD)
  { id: "doc_010", studentId: "std_001", type: "PHOTO", name: "passport_photo.jpg", url: "#", uploadedAt: "2026-01-12T09:00:00Z", uploadedBy: "Ayoub Mgassa", verified: true },
  { id: "doc_011", studentId: "std_001", type: "TRANSCRIPT", name: "a_level_transcript.pdf", url: "#", uploadedAt: "2026-01-13T11:20:00Z", uploadedBy: "Ayoub Mgassa", verified: false, notes: "Awaiting notarization" },

  // std_002 - Jane Smith (COUNSELING)
  { id: "doc_020", studentId: "std_002", type: "PASSPORT", name: "passport_jane.pdf", url: "#", uploadedAt: "2026-01-15T10:00:00Z", uploadedBy: "Kevin Dube", verified: true },
  { id: "doc_021", studentId: "std_002", type: "TRANSCRIPT", name: "transcript_jane.pdf", url: "#", uploadedAt: "2026-01-16T11:00:00Z", uploadedBy: "Kevin Dube", verified: true },
  { id: "doc_022", studentId: "std_002", type: "REFERENCE_LETTER", name: "ref_principal.pdf", url: "#", uploadedAt: "2026-01-18T14:00:00Z", uploadedBy: "Kevin Dube", verified: true },

  // std_003 - Ali Hassan (PAYMENT_PENDING)
  { id: "doc_030", studentId: "std_003", type: "PASSPORT", name: "passport_ali.jpg", url: "#", uploadedAt: "2026-01-20T09:30:00Z", uploadedBy: "Ayoub Mgassa", verified: true },
  { id: "doc_031", studentId: "std_003", type: "TRANSCRIPT", name: "transcript_ali.pdf", url: "#", uploadedAt: "2026-01-22T12:15:00Z", uploadedBy: "Ayoub Mgassa", verified: true },
  { id: "doc_032", studentId: "std_003", type: "CERTIFICATE", name: "ielts_results.pdf", url: "#", uploadedAt: "2026-02-01T16:00:00Z", uploadedBy: "Ayoub Mgassa", verified: true },

  // std_004 - Fatima Ali (PAYMENT_CONFIRMED)
  { id: "doc_040", studentId: "std_004", type: "PASSPORT", name: "passport_fatima.pdf", url: "#", uploadedAt: "2026-01-18T08:30:00Z", uploadedBy: "Kevin Dube", verified: true },
  { id: "doc_041", studentId: "std_004", type: "TRANSCRIPT", name: "transcript_fatima.pdf", url: "#", uploadedAt: "2026-01-20T10:00:00Z", uploadedBy: "Kevin Dube", verified: true },
  { id: "doc_042", studentId: "std_004", type: "BANK_STATEMENT", name: "sponsor_bank_statement.pdf", url: "#", uploadedAt: "2026-02-08T15:30:00Z", uploadedBy: "Kevin Dube", verified: false, notes: "Sponsor letter pending" },

  // std_005 - Michael Johnson (APPLICATION_SUBMITTED)
  { id: "doc_001", studentId: "std_005", type: "PASSPORT", name: "passport_front.pdf", url: "#", uploadedAt: "2026-01-15T10:00:00Z", uploadedBy: "Michael Johnson", verified: true },
  { id: "doc_002", studentId: "std_005", type: "TRANSCRIPT", name: "bs_transcript.pdf", url: "#", uploadedAt: "2026-01-16T11:30:00Z", uploadedBy: "Michael Johnson", verified: false, notes: "Needs notarization" },
  { id: "doc_053", studentId: "std_005", type: "REFERENCE_LETTER", name: "ref_supervisor.pdf", url: "#", uploadedAt: "2026-01-20T13:00:00Z", uploadedBy: "Ayoub Mgassa", verified: true },
  { id: "doc_054", studentId: "std_005", type: "CERTIFICATE", name: "gre_score.pdf", url: "#", uploadedAt: "2026-01-25T11:00:00Z", uploadedBy: "Ayoub Mgassa", verified: true },

  // std_006 - Sarah Connor (UNIVERSITY_ACCEPTED)
  { id: "doc_003", studentId: "std_006", type: "PASSPORT", name: "passport.jpg", url: "#", uploadedAt: "2025-12-10T09:15:00Z", uploadedBy: "Sarah Connor", verified: true },
  { id: "doc_061", studentId: "std_006", type: "TRANSCRIPT", name: "transcript_sarah.pdf", url: "#", uploadedAt: "2025-12-12T10:30:00Z", uploadedBy: "Kevin Dube", verified: true },
  { id: "doc_062", studentId: "std_006", type: "OFFER_LETTER", name: "melbourne_offer.pdf", url: "#", uploadedAt: "2026-02-12T14:00:00Z", uploadedBy: "Justice Mwampiki", verified: true },

  // std_007 - David Beckham (TRAVEL_PLANNING)
  { id: "doc_004", studentId: "std_007", type: "OFFER_LETTER", name: "oxford_offer.pdf", url: "#", uploadedAt: "2026-02-05T14:20:00Z", uploadedBy: "David Beckham", verified: true },
  { id: "doc_071", studentId: "std_007", type: "PASSPORT", name: "passport_david.pdf", url: "#", uploadedAt: "2025-12-20T09:00:00Z", uploadedBy: "Ayoub Mgassa", verified: true },
  { id: "doc_072", studentId: "std_007", type: "VISA", name: "tier4_visa.pdf", url: "#", uploadedAt: "2026-02-16T15:00:00Z", uploadedBy: "Wisdom Mwaipape", verified: true },
  { id: "doc_073", studentId: "std_007", type: "BANK_STATEMENT", name: "sponsor_bank.pdf", url: "#", uploadedAt: "2026-01-28T11:00:00Z", uploadedBy: "Ayoub Mgassa", verified: true },

  // std_008 - Emma Watson (TRAVELLED)
  { id: "doc_080", studentId: "std_008", type: "OFFER_LETTER", name: "harvard_offer.pdf", url: "#", uploadedAt: "2026-01-16T10:00:00Z", uploadedBy: "Justice Mwampiki", verified: true },
  { id: "doc_081", studentId: "std_008", type: "PASSPORT", name: "passport_emma.pdf", url: "#", uploadedAt: "2025-11-20T09:30:00Z", uploadedBy: "Kevin Dube", verified: true },
  { id: "doc_082", studentId: "std_008", type: "VISA", name: "f1_visa.pdf", url: "#", uploadedAt: "2026-01-11T12:00:00Z", uploadedBy: "Wisdom Mwaipape", verified: true },

  // std_009 - Chris Evans (MONITORING)
  { id: "doc_090", studentId: "std_009", type: "OFFER_LETTER", name: "mit_offer.pdf", url: "#", uploadedAt: "2025-03-02T10:00:00Z", uploadedBy: "Justice Mwampiki", verified: true },
  { id: "doc_091", studentId: "std_009", type: "VISA", name: "f1_visa.pdf", url: "#", uploadedAt: "2025-07-02T11:30:00Z", uploadedBy: "Wisdom Mwaipape", verified: true },

  // std_010 - Aisha Mwale (UNIVERSITY_ACCEPTED, visa applied)
  { id: "doc_100", studentId: "std_010", type: "OFFER_LETTER", name: "birmingham_offer.pdf", url: "#", uploadedAt: "2026-03-06T10:00:00Z", uploadedBy: "Justice Mwampiki", verified: true },
  { id: "doc_101", studentId: "std_010", type: "PASSPORT", name: "passport_aisha.pdf", url: "#", uploadedAt: "2026-02-05T12:00:00Z", uploadedBy: "Michael Osei", verified: true },

  // std_011 - Paul Ndlovu (PAYMENT_PENDING)
  { id: "doc_110", studentId: "std_011", type: "TRANSCRIPT", name: "transcript_paul.pdf", url: "#", uploadedAt: "2026-02-18T10:30:00Z", uploadedBy: "Michael Osei", verified: false, notes: "Pending re-upload - page 3 unreadable." },

  // std_012 - Zainab Ahmed (TRAVELLED)
  { id: "doc_120", studentId: "std_012", type: "OFFER_LETTER", name: "leeds_offer.pdf", url: "#", uploadedAt: "2025-11-11T10:00:00Z", uploadedBy: "Justice Mwampiki", verified: true },
  { id: "doc_121", studentId: "std_012", type: "VISA", name: "tier4_visa.pdf", url: "#", uploadedAt: "2025-12-02T13:00:00Z", uploadedBy: "Wisdom Mwaipape", verified: true },

  // std_013 - Brian Kibet (APPLICATION_SUBMITTED)
  { id: "doc_130", studentId: "std_013", type: "PASSPORT", name: "passport_brian.pdf", url: "#", uploadedAt: "2026-02-28T11:00:00Z", uploadedBy: "Fatima Noor", verified: true },
  { id: "doc_131", studentId: "std_013", type: "TRANSCRIPT", name: "transcript_brian.pdf", url: "#", uploadedAt: "2026-03-01T09:30:00Z", uploadedBy: "Fatima Noor", verified: true },

  // std_014 - Mary Wanjiru (TRAVEL_PLANNING)
  { id: "doc_140", studentId: "std_014", type: "OFFER_LETTER", name: "sunway_offer.pdf", url: "#", uploadedAt: "2026-01-21T10:00:00Z", uploadedBy: "Justice Mwampiki", verified: true },
  { id: "doc_141", studentId: "std_014", type: "PASSPORT", name: "passport_mary.pdf", url: "#", uploadedAt: "2025-11-25T10:00:00Z", uploadedBy: "James Kamau", verified: true },
  { id: "doc_142", studentId: "std_014", type: "VISA", name: "student_pass.pdf", url: "#", uploadedAt: "2026-03-01T13:30:00Z", uploadedBy: "Wisdom Mwaipape", verified: true },

  // std_015 - Emmanuel Ochieng (LEAD)
  { id: "doc_150", studentId: "std_015", type: "PHOTO", name: "profile_photo.jpg", url: "#", uploadedAt: "2026-03-06T09:00:00Z", uploadedBy: "Sofia Garcia", verified: true },
];

export function getDocumentsByStudentId(studentId: string): Document[] {
  return mockDocuments.filter(d => d.studentId === studentId);
}
