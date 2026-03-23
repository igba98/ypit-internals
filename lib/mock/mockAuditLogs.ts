import { AuditLog } from '@/types';

export const mockAuditLogs: AuditLog[] = [
  {
    id: "log_001",
    userId: "usr_001",
    userName: "Alice Johnson",
    userRole: "MANAGING_DIRECTOR",
    action: "LOGIN",
    module: "AUTH",
    detail: "User logged in successfully.",
    ipAddress: "192.168.1.10",
    timestamp: "2026-03-22T08:00:00Z"
  },
  {
    id: "log_002",
    userId: "usr_002",
    userName: "Bob Smith",
    userRole: "ADMISSIONS",
    action: "STAGE_CHANGE",
    module: "STUDENT",
    entityId: "std_001",
    entityType: "Student",
    detail: "Updated student pipeline stage to ENROLLED.",
    ipAddress: "192.168.1.15",
    timestamp: "2026-03-22T09:15:00Z"
  },
  {
    id: "log_003",
    userId: "usr_003",
    userName: "Charlie Brown",
    userRole: "MARKETING_STAFF",
    action: "CREATE",
    module: "LEAD",
    entityId: "ld_005",
    entityType: "Lead",
    detail: "Created new lead from Website Form.",
    ipAddress: "192.168.1.20",
    timestamp: "2026-03-22T10:30:00Z"
  },
  {
    id: "log_004",
    userId: "usr_001",
    userName: "Alice Johnson",
    userRole: "MANAGING_DIRECTOR",
    action: "DELETE",
    module: "TASK",
    entityId: "tsk_010",
    entityType: "Task",
    detail: "Deleted task 'Follow up with university'.",
    ipAddress: "192.168.1.10",
    timestamp: "2026-03-22T11:45:00Z"
  },
  {
    id: "log_005",
    userId: "usr_004",
    userName: "Diana Prince",
    userRole: "FINANCE",
    action: "PAYMENT_RECORDED",
    module: "PAYMENT",
    entityId: "pay_002",
    entityType: "Payment",
    detail: "Marked payment as PAID.",
    ipAddress: "192.168.1.25",
    timestamp: "2026-03-22T13:00:00Z"
  }
];

export function getAuditLogsByUser(userId: string): AuditLog[] {
  return mockAuditLogs.filter(log => log.userId === userId);
}
