import { Transform } from '@engine/ecs/components/Transform';
import { Entity } from '@engine/ecs/Entity';

export function isPlayerDetected(aiEntity: Entity, playerEntity: Entity, detectionRange = 400): boolean {
  const aiTransform = aiEntity.getComponent('transform') as Transform | undefined;
  const playerTransform = playerEntity.getComponent('transform') as Transform | undefined;
  if (!aiTransform || !playerTransform) return false;
  const aiPos = aiTransform.getPosition();
  const playerPos = playerTransform.getPosition();
  const dx = playerPos.x - aiPos.x;
  const dy = playerPos.y - aiPos.y;
  return (dx * dx + dy * dy) <= (detectionRange * detectionRange);
} 