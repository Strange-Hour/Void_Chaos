export interface IEnemyTypeDefinition {
  id: string;
  name: string;
  config: {
    speed: number;
    health: number;
    damage: number;
    detectionRange: number;
    attackRange: number;
    scoreValue: number;
  };
  behavior: {
    defaultState: string;
    attackCooldown: number;
    // Add any behavior-specific properties here
  };
} 