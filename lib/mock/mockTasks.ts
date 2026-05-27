import { Task, TaskActivityEntry } from '@/types';

interface LegacyEndOfDayReport {
  taskSummary: string;
  progressMade: string;
  blockers?: string;
  tomorrowPlan: string;
  percentageComplete: number;
  submittedAt: string;
  submittedById: string;
  submittedByName: string;
}

interface LegacyTaskSeed {
  id: string;
  title: string;
  description: string;
  assignedToIds: string[];
  assignedToNames: string[];
  assignedById: string;
  assignedByName: string;
  department: string;
  priority: Task['priority'];
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  endOfDayReport?: LegacyEndOfDayReport;
}

const legacySeeds: LegacyTaskSeed[] = [
  {
    id: 'tsk_005',
    title: 'Review Q1 Financial Audits',
    description: 'Personal oversight check on all Q1 agency and application fee aggregations. Follow up with Finance department on outstanding balances.',
    assignedToIds: ['usr_001'],
    assignedToNames: ['Shedrack Masine'],
    assignedById: 'usr_001',
    assignedByName: 'Shedrack Masine',
    department: 'Executive',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: '2026-03-30T00:00:00Z',
    createdAt: '2026-03-22T00:00:00Z',
    updatedAt: '2026-03-22T00:00:00Z',
    tags: ['MD', 'Audit'],
  },
  {
    id: 'tsk_006',
    title: 'Verify Student Intake Requirements',
    description: 'Check the master application grid against pending conditional offers for the September UK intake. Advise unqualified candidates.',
    assignedToIds: ['usr_005'],
    assignedToNames: ['Justice Mwampiki'],
    assignedById: 'usr_001',
    assignedByName: 'Shedrack Masine',
    department: 'Admissions',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: '2026-03-26T00:00:00Z',
    createdAt: '2026-03-21T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z',
    tags: ['Admissions', 'Verification'],
  },
  {
    id: 'tsk_007',
    title: 'Process Escalated Operations Check-ins',
    description: 'Contact the Escalated student studying at MIT. Record comprehensive wellbeing check and provide psychological support resources alongside university staff.',
    assignedToIds: ['usr_007'],
    assignedToNames: ['Lucy Masine'],
    assignedById: 'usr_001',
    assignedByName: 'Shedrack Masine',
    department: 'Operations',
    priority: 'URGENT',
    status: 'TODO',
    dueDate: '2026-03-24T00:00:00Z',
    createdAt: '2026-03-22T00:00:00Z',
    updatedAt: '2026-03-22T00:00:00Z',
    tags: ['Escalation', 'Support'],
  },
  {
    id: 'tsk_008',
    title: 'Distribute Commission Documents',
    description: "Distribute and file the standard sub-agent commission reports natively from last month's conversion pipelines. Contact partners for sign-offs.",
    assignedToIds: ['usr_009'],
    assignedToNames: ['Kevin Dube'],
    assignedById: 'usr_002',
    assignedByName: 'Lilian Masine',
    department: 'Marketing',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '2026-03-28T00:00:00Z',
    createdAt: '2026-03-22T00:00:00Z',
    updatedAt: '2026-03-22T00:00:00Z',
    tags: ['Sub-Agent', 'Commission'],
  },
  {
    id: 'tsk_001',
    title: 'Follow up with pending visa applications for UK intake',
    description: "Contact all students who have applied for UK visas but haven't received a decision yet. Ensure they have all necessary documentation ready for potential interviews.",
    assignedToIds: ['usr_006'],
    assignedToNames: ['Wisdom Mwaipape'],
    assignedById: 'usr_001',
    assignedByName: 'Shedrack Masine',
    department: 'Travel',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2026-03-25T00:00:00Z',
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z',
    tags: ['UK', 'Visa', 'Follow-up'],
  },
  {
    id: 'tsk_002',
    title: 'Prepare monthly financial report',
    description: 'Compile all agency fees, application fees, and tuition payments received this month. Reconcile with bank statements and prepare the summary for the MD.',
    assignedToIds: ['usr_004'],
    assignedToNames: ['Cosmas Cosmas'],
    assignedById: 'usr_001',
    assignedByName: 'Shedrack Masine',
    department: 'Finance',
    priority: 'URGENT',
    status: 'TODO',
    dueDate: '2026-03-28T00:00:00Z',
    createdAt: '2026-03-22T00:00:00Z',
    updatedAt: '2026-03-22T00:00:00Z',
    tags: ['Finance', 'Report', 'Monthly'],
  },
  {
    id: 'tsk_003',
    title: 'Update marketing materials for Malaysia universities',
    description: "The new brochures for Taylor's University and APU need to be updated with the latest fee structures and intake dates. Coordinate with the design team.",
    assignedToIds: ['usr_002', 'usr_008'],
    assignedToNames: ['Lilian Masine', 'Ayoub Mgassa'],
    assignedById: 'usr_002',
    assignedByName: 'Lilian Masine',
    department: 'Marketing',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    dueDate: '2026-03-15T00:00:00Z',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
    tags: ['Malaysia', 'Marketing', 'Brochure'],
    endOfDayReport: {
      taskSummary: "Updated all brochures with new fee structures.",
      progressMade: "Completed Taylor's and APU brochures. Sent to print.",
      tomorrowPlan: "Start working on Australian university materials.",
      percentageComplete: 100,
      submittedAt: "2026-03-14T17:30:00Z",
      submittedById: "usr_008",
      submittedByName: "Ayoub Mgassa",
    },
  },
  {
    id: 'tsk_004',
    title: 'Resolve IT issue with student portal login',
    description: 'Several students reported being unable to log into the portal to check their application status. Investigate the authentication service logs.',
    assignedToIds: ['usr_003'],
    assignedToNames: ['Noel Godson'],
    assignedById: 'usr_001',
    assignedByName: 'Shedrack Masine',
    department: 'IT',
    priority: 'URGENT',
    status: 'BLOCKED',
    dueDate: '2026-03-23T00:00:00Z',
    createdAt: '2026-03-22T08:00:00Z',
    updatedAt: '2026-03-22T10:00:00Z',
    tags: ['IT', 'Bug', 'Portal'],
  },
];

function migrateLegacyTask(seed: LegacyTaskSeed): Task {
  const isPersonal =
    seed.assignedToIds.length === 1 && seed.assignedToIds[0] === seed.assignedById;

  const createdEntry: TaskActivityEntry = {
    id: `act_${seed.id}_created`,
    type: 'CREATED',
    at: seed.createdAt,
    actorId: seed.assignedById,
    actorName: seed.assignedByName,
  };

  const activity: TaskActivityEntry[] = [createdEntry];
  let currentRound = 0;

  if (seed.endOfDayReport) {
    activity.push({
      id: `act_${seed.id}_submitted_1`,
      type: 'SUBMITTED',
      at: seed.endOfDayReport.submittedAt,
      actorId: seed.endOfDayReport.submittedById,
      actorName: seed.endOfDayReport.submittedByName,
      note: seed.endOfDayReport.taskSummary,
      progressMade: seed.endOfDayReport.progressMade,
      percentageComplete: seed.endOfDayReport.percentageComplete,
      nextActions: seed.endOfDayReport.tomorrowPlan,
      blockers: seed.endOfDayReport.blockers,
    });
    currentRound = 1;
  }

  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    assignedToIds: seed.assignedToIds,
    assignedToNames: seed.assignedToNames,
    assignedById: seed.assignedById,
    assignedByName: seed.assignedByName,
    department: seed.department,
    priority: seed.priority,
    status: seed.status,
    dueDate: seed.dueDate,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
    tags: seed.tags,
    activity,
    isPersonal,
    currentRound,
  };
}

export const mockTasks: Task[] = legacySeeds.map(migrateLegacyTask);

export function getTasksByAssignee(userId: string): Task[] {
  return mockTasks.filter((t) => t.assignedToIds.includes(userId));
}

export function getTasksByDepartment(dept: string): Task[] {
  return mockTasks.filter((t) => t.department === dept);
}

export function getTasksByAssigner(userId: string): Task[] {
  return mockTasks.filter((t) => t.assignedById === userId);
}

export function getPendingReportTasks(userId: string): Task[] {
  return mockTasks.filter(
    (t) =>
      t.assignedToIds.includes(userId) &&
      (t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'CHANGES_REQUESTED')
  );
}
