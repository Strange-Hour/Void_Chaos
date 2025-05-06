import { ConditionParams } from './types';
import { getPlayerDistance } from '../utils/getPlayerDistance';
import { IEnemyTypeDefinition } from '../../../enemies/types/IEnemyTypeDefinition';

export function withinDetectionRange({ entity, ai }: ConditionParams): boolean {
  const def = (entity as { enemyDef?: IEnemyTypeDefinition }).enemyDef;
  const detectionRange = def?.config?.detectionRange ?? 400;
  return getPlayerDistance(entity, ai) <= detectionRange;
}

export function outOfDetectionRange({ entity, ai }: ConditionParams): boolean {
  const def = (entity as { enemyDef?: IEnemyTypeDefinition }).enemyDef;
  const detectionRange = def?.config?.detectionRange ?? 400;
  return getPlayerDistance(entity, ai) > detectionRange;
}

export function withinAttackRange({ entity, ai }: ConditionParams): boolean {
  const def = (entity as { enemyDef?: IEnemyTypeDefinition }).enemyDef;
  const attackRange = def?.config?.attackRange ?? 50;
  return getPlayerDistance(entity, ai) <= attackRange;
}

export function outOfAttackRange({ entity, ai }: ConditionParams): boolean {
  const def = (entity as { enemyDef?: IEnemyTypeDefinition }).enemyDef;
  const attackRange = def?.config?.attackRange ?? 50;
  return getPlayerDistance(entity, ai) > attackRange;
} 