import { StageTransition } from '@/types';

export const mockStageTransitions: StageTransition[] = [];

export function getTransitionsForStudent(studentId: string): StageTransition[] {
  return mockStageTransitions
    .filter(t => t.studentId === studentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}