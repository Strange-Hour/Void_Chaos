import { Vector2 } from '@engine/math/Vector2';

export function getDistanceToTarget(pos: Vector2, targetPos: Vector2): number {
  const dx = targetPos.x - pos.x;
  const dy = targetPos.y - pos.y;
  return Math.sqrt(dx * dx + dy * dy);
} 