import { TravelRecord } from '@/types';

export const mockTravelRecords: TravelRecord[] = [
  {
    id: "trv_001",
    studentId: "std_007",
    studentName: "David Beckham",
    passportStatus: "READY",
    passportNumber: "MN5678901",
    passportExpiry: "2030-01-01",
    visaStatus: "APPROVED",
    visaType: "Tier 4 Student",
    visaApplicationDate: "2026-01-15T00:00:00Z",
    visaAppointmentDate: "2026-02-01T00:00:00Z",
    visaApprovalDate: "2026-02-15T00:00:00Z",
    visaExpiryDate: "2028-09-30T00:00:00Z",
    flightDate: "2026-09-10T00:00:00Z",
    flightNumber: "BA123",
    airline: "British Airways",
    departureCity: "Nairobi",
    destinationCity: "London",
    destinationAirport: "Heathrow (LHR)",
    airportPickupArranged: true,
    pickupContactName: "Oxford Uni Transport",
    pickupContactPhone: "+44123456789",
    accommodationAddress: "123 High St, Oxford",
    travelStatus: "READY",
    updatedAt: "2026-02-20T00:00:00Z"
  },
  {
    id: "trv_002",
    studentId: "std_008",
    studentName: "Emma Watson",
    passportStatus: "READY",
    passportNumber: "OP2345678",
    passportExpiry: "2029-05-15",
    visaStatus: "APPROVED",
    visaType: "F-1 Student",
    visaApplicationDate: "2025-12-01T00:00:00Z",
    visaAppointmentDate: "2025-12-15T00:00:00Z",
    visaApprovalDate: "2026-01-10T00:00:00Z",
    visaExpiryDate: "2030-09-30T00:00:00Z",
    flightDate: "2026-08-25T00:00:00Z",
    flightNumber: "DL456",
    airline: "Delta Airlines",
    departureCity: "Entebbe",
    destinationCity: "Boston",
    destinationAirport: "Logan (BOS)",
    airportPickupArranged: true,
    pickupContactName: "Harvard Shuttle",
    pickupContactPhone: "+16171234567",
    accommodationAddress: "456 Main St, Cambridge",
    travelStatus: "TRAVELLED",
    updatedAt: "2026-03-05T00:00:00Z"
  }
];

export function getTravelByStudentId(studentId: string): TravelRecord | undefined {
  return mockTravelRecords.find(t => t.studentId === studentId);
}

export function getUpcomingDepartures(days: number): TravelRecord[] {
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + days);
  
  return mockTravelRecords.filter(t => {
    if (!t.flightDate) return false;
    const flightDate = new Date(t.flightDate);
    return flightDate >= now && flightDate <= future;
  });
}
