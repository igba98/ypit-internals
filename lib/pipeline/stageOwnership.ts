import { PipelineStage, Role, ROLES } from '@/types';

/**
 * For each pipeline stage, the roles that "own" that stage -
 * meaning: the student appears in their MyQueue, and they have
 * the right to advance the student to the next stage.
 *
 * Source of truth: spec section 11 (Role → Stage Ownership).
 */
/** All Relations Officers are interchangeable owners of a student. */
const RO_OWNERS: Role[] = [
  ROLES.MARKETING_STAFF,
  ROLES.TRAVEL,
  ROLES.MARKETING_MANAGER,
];

export const STAGE_OWNERS: Record<PipelineStage, Role[]> = {
  LEAD: [...RO_OWNERS, ROLES.SUB_AGENT],
  COUNSELING: RO_OWNERS,
  PAYMENT_PENDING: [ROLES.FINANCE],
  PAYMENT_CONFIRMED: [ROLES.ADMISSIONS],
  APPLICATION_SUBMITTED: [ROLES.ADMISSIONS],
  UNIVERSITY_ACCEPTED: RO_OWNERS,
  TRAVEL_PLANNING: RO_OWNERS,
  TRAVELLED: [ROLES.OPERATIONS],
  MONITORING: [ROLES.OPERATIONS],
};

export function getStageOwners(stage: PipelineStage): Role[] {
  return STAGE_OWNERS[stage] ?? [];
}

export function isStageOwner(role: Role, stage: PipelineStage): boolean {
  return getStageOwners(stage).includes(role);
}