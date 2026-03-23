export interface DailyReport {
  id: string;
  userId: string;
  date: string;
  tasksCompleted: number;
  summary: string;
  roadblocks?: string;
}

export const mockReports: DailyReport[] = [
  {
    id: "rep_1",
    userId: "usr_1",
    date: new Date().toISOString(),
    tasksCompleted: 4,
    summary: "Followed up with 4 leads. Sent application drafts to 2 universities.",
  }
];
