import { Entity } from '@engine/ecs/Entity';
import { AI } from '@engine/ecs/components/AI';
import { MovementPatternContext } from '../types';

export interface ConditionParams {
  entity: Entity;
  ai: AI;
  target: Entity | null;
  context: MovementPatternContext;
  stateData: Record<string, unknown>;
} 