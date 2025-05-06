import { ConditionParams } from './types';
import { hasLineOfSight } from '../utils/lineOfSight';
import { Transform } from '@engine/ecs/components/Transform';

export function hasLineOfSightToPlayer({ entity, ai, context }: ConditionParams): boolean {
  const grid = context.grid;
  const transform = entity.getComponent('transform') as Transform | undefined;
  const pos = transform?.getPosition?.();
  const target = ai.getTarget();
  if (!pos || !target) return false;
  const from = grid.worldToGrid(pos.x, pos.y);
  const to = grid.worldToGrid(target.position.x, target.position.y);
  return hasLineOfSight(grid, from, to);
}

export function lacksLineOfSightToPlayer(params: ConditionParams): boolean {
  return !hasLineOfSightToPlayer(params);
} 