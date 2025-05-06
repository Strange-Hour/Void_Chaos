import { Entity } from '@engine/ecs/Entity';
import { AI } from '@engine/ecs/components/AI';
import { Transform } from '@engine/ecs/components/Transform';
import {
  IStateMachine,
  EnemyMovementStateMachine,
  MovementStateType,
  MovementPatternDefinition,
  MovementPatternContext
} from './types';
import { debugSearchStateMap, getEntityId } from './utils/debugSearchState';

/**
 * Generic runtime state machine for enemy AI movement.
 */
export class StateMachine implements IStateMachine {
  private definition: EnemyMovementStateMachine;
  private currentState: MovementStateType;
  private stateData: Record<string, unknown> = {};
  private lastPlayerPosition: { x: number, y: number } | null = null;

  constructor(definition: EnemyMovementStateMachine) {
    this.definition = definition;
    this.currentState = definition.initial;
  }

  getCurrentState(): MovementStateType {
    return this.currentState;
  }

  getCurrentPattern(): MovementPatternDefinition {
    const stateDef = this.definition.states.find(s => s.state === this.currentState);
    if (!stateDef) {
      throw new Error(`No pattern found for state: ${this.currentState}`);
    }
    return stateDef.pattern;
  }

  update(params: {
    entity: Entity;
    ai: AI;
    target: Entity | null;
    context: MovementPatternContext;
  }): void {
    // Track last seen player position if visible
    let playerPos: { x: number, y: number } | null = null;
    if (params.target && params.target !== params.entity) {
      const playerTransform = (params.target.getComponent && params.target.getComponent('transform')) as Transform | undefined;
      if (playerTransform) {
        playerPos = playerTransform.getPosition();
      }
    }
    // If in chase, update lastPlayerPosition
    if (this.currentState === 'chase') {
      if (playerPos) {
        this.lastPlayerPosition = { x: playerPos.x, y: playerPos.y };
      } else {
        const t = params.ai.getTarget();
        if (t) {
          this.lastPlayerPosition = { x: t.position.x, y: t.position.y };
        }
      }
    }
    // If in search, increment timer
    if (this.currentState === 'search') {
      this.stateData.searchTimer = (this.stateData.searchTimer as number || 0) + 16; // TODO: use real deltaTime
    }
    // Store the current state before evaluating transitions
    const prevState: MovementStateType = this.currentState;
    // Evaluate all transitions from the current state
    for (const transition of this.definition.transitions) {
      if (transition.from === prevState) {
        const shouldTransition = transition.condition({
          ...params,
          stateData: this.stateData,
        });
        if (shouldTransition) {
          // On entering search, set lastKnownPlayerPosition and reset timer
          if (transition.to === 'search') {
            // Fallback: use current player position if lastPlayerPosition is missing
            let lastPos = this.lastPlayerPosition;
            if (!lastPos && params.target) {
              const playerTransform = params.target.getComponent && params.target.getComponent('transform');
              if (playerTransform) {
                lastPos = (playerTransform as import('@engine/ecs/components/Transform').Transform).getPosition();
              } else {
                console.warn(`[StateMachine] Fallback failed: no transform for target on entity ${getEntityId(params.entity)}`, params.target);
              }
            } else if (!lastPos) {
              console.warn(`[StateMachine] Fallback failed: no target for entity ${getEntityId(params.entity)}`);
            }
            if (lastPos) {
              this.stateData.lastKnownPlayerPosition = { ...lastPos };
              this.stateData.searchTimer = 0;
              this.stateData.hasReachedLastKnown = false;
              // Set debug search state
              const entityId = getEntityId(params.entity);
              const pattern = this.getCurrentPattern();
              const patrolRadius = pattern.type === 'search' ? (pattern as import('./types').ISearchPattern).searchRadius : undefined;
              debugSearchStateMap.set(entityId, { isSearching: true, patrolRadius });
              this.currentState = transition.to;
              break;
            } else {
              // Prevent transition if we have no last known player position
              const entityId = getEntityId(params.entity);
              console.warn(`[StateMachine] Prevented search transition for entity ${entityId} (no lastPlayerPosition)`);
              continue; // Skip this transition
            }
          }
          // On leaving search, clear lastKnownPlayerPosition, timer, wanderTarget, and hasReachedLastKnown
          if (isSearchState(prevState) && (transition.to as string) !== 'search') {
            delete this.stateData.lastKnownPlayerPosition;
            delete this.stateData.searchTimer;
            delete this.stateData.wanderTarget;
            delete this.stateData.hasReachedLastKnown;
            // Clear debug search state
            const entityId = getEntityId(params.entity);
            debugSearchStateMap.set(entityId, { isSearching: false, patrolRadius: undefined });
          }
          // Clear debug flags if leaving 'chase' or 'search' state
          if ((prevState === 'chase' || prevState === 'search') && transition.to !== prevState) {
            (params.entity as unknown as { __isSearching?: boolean }).__isSearching = false;
            (params.entity as unknown as { __patrolRadius?: number }).__patrolRadius = undefined;
          }
          this.currentState = transition.to;
          break;
        }
      }
    }
  }

  getStateData(): Record<string, unknown> {
    return this.stateData;
  }
}

// Type guard for 'search' state
function isSearchState(state: unknown): state is 'search' {
  return state === 'search';
} 