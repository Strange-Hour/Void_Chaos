import { Entity } from '@engine/ecs/Entity';

export interface DebugSearchState {
  isSearching?: boolean;
  patrolRadius?: number;
}

export function getEntityId(entity: Entity): string {
  return typeof entity.getId === 'function' ? String(entity.getId()) : String(entity);
}

export const debugSearchStateMap = new Map<string, DebugSearchState>(); 