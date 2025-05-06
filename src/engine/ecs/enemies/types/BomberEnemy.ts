import { IEnemyTypeDefinition } from './IEnemyTypeDefinition';

export const BomberEnemy: IEnemyTypeDefinition = {
  id: 'bomber',
  name: 'Bomber Enemy',
  color: '#f97316',
  config: {
    speed: 120,
    health: 80,
    damage: 50,
    detectionRange: 300,
    attackRange: 100,
    scoreValue: 175,
  },
  behavior: {
    attackCooldown: 2000, // Longer cooldown due to high damage

    // Define available movement patterns
    movementPatterns: {
      // Simple chase pattern to reach the target
      'chase': { type: 'chase', targetType: 'player' },
      // Idle state if needed
      'idle': { type: 'idle' }
    },

    // Set the initial pattern ID
    initialPatternId: 'chase',
  },
  patrolRadius: 96,
}; 