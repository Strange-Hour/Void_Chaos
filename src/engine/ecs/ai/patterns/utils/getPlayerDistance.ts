import { Entity } from '@engine/ecs/Entity';
import { AI } from '@engine/ecs/components/AI';
import { Transform } from '@engine/ecs/components/Transform';

export function getPlayerDistance(entity: Entity, ai: AI): number {
  const target = ai.getTarget();
  if (!target || !target.position) return Infinity;
  const transform = entity.getComponent('transform') as Transform | undefined;
  const pos = transform?.getPosition?.();
  if (!pos) return Infinity;
  const dx = target.position.x - pos.x;
  const dy = target.position.y - pos.y;
  return Math.sqrt(dx * dx + dy * dy);
} 