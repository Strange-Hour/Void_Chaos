import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';
// Import specific pattern types if needed for casting or stricter typing
// import { IChasePattern, IIdlePattern } from '@engine/ecs/ai/patterns/types';

export const BasicEnemy: IEnemyTypeDefinition = {
  id: 'basic',
  name: 'Basic Enemy',
  color: '#ef4444',
  config: {
    speed: 150,
    health: 100,
    damage: 20,
    detectionRange: 400,
    attackRange: 50,
    scoreValue: 100,
  },
  behavior: {
    // Remove old defaultState
    // defaultState: 'chase',
    attackCooldown: 1000,

    // Define available movement patterns
    movementPatterns: {
      'chase': { type: 'chase', targetType: 'player' }, // as IChasePattern (optional cast)
      'idle': { type: 'idle' }, // as IIdlePattern (optional cast)
    },

    // Set the initial pattern ID
    initialPatternId: 'chase',
  }
}; 