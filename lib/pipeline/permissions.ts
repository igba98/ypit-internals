import { PipelineStage, ROLES, Role } from '@/types';
import { getTransition } from './transitions';

export function canAdvance(role: Role, fromStage: PipelineStage): boolean {
  const t = getTransition(fromStage);
  if (!t) return false;
  if (role === ROLES.MANAGING_DIRECTOR) return true;
  return t.allowedRoles.includes(role);
}

export function canRevert(role: Role): boolean {
  return role === ROLES.MANAGING_DIRECTOR;
}