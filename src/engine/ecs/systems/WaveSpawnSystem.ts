import { System } from '../System';
import { Entity } from '../Entity';
import { EnemyFactory, EnemySpawnOptions } from '../factories/EnemyFactory';
import { EnemyType } from '../components/Enemy';
import { Vector2 } from '@engine/math/Vector2';
import { Transform } from '../components/Transform';
import { World } from '@engine/ecs/World';

export interface WaveConfig {
  enemies: {
    type: EnemyType;
    count: number;
  }[];
  spawnDelay: number;  // Delay between spawning each enemy in ms
  waveDelay: number;   // Delay before starting next wave in ms
  difficultyMultiplier?: number; // Optional difficulty multiplier for this wave
}

export interface SpawnPoint {
  position: Vector2;
  weight: number;      // Probability weight for this spawn point
}

export interface DifficultyConfig {
  baseHealth: number;      // Base health multiplier
  baseDamage: number;      // Base damage multiplier
  baseSpeed: number;       // Base speed multiplier
  waveScaling: number;     // How much difficulty increases per wave
  playerScaling: number;   // How much difficulty increases per additional player
}

/**
 * System that manages wave-based enemy spawning
 */
export class WaveSpawnSystem extends System {
  private waves: WaveConfig[];
  private spawnPoints: SpawnPoint[];
  private currentWave: number;
  private enemiesRemaining: { type: EnemyType; count: number }[];
  private lastSpawnTime: number;
  private waveStartTime: number;
  private isWaveActive: boolean;
  private totalWeight: number;
  protected world: World;
  private difficultyConfig: DifficultyConfig;
  private currentDifficultyMultiplier: number;
  private spawnPattern: 'random' | 'sequential' | 'synchronized' = 'random';
  private currentSpawnIndex: number = 0;

  constructor(world: World) {
    super(['transform']);
    this.world = world;
    this.waves = [];
    this.spawnPoints = [];
    this.currentWave = 0;
    this.enemiesRemaining = [];
    this.lastSpawnTime = 0;
    this.waveStartTime = 0;
    this.isWaveActive = false;
    this.totalWeight = 0;
    this.currentDifficultyMultiplier = 1;
    this.difficultyConfig = {
      baseHealth: 1,
      baseDamage: 1,
      baseSpeed: 1,
      waveScaling: 0.1,    // 10% increase per wave
      playerScaling: 0.3,   // 30% increase per additional player
    };
  }

  /**
   * Configure the wave spawning system with wave definitions and spawn points
   */
  configure(waves: WaveConfig[], spawnPoints: SpawnPoint[], difficultyConfig?: Partial<DifficultyConfig>): void {
    this.waves = waves;
    this.spawnPoints = spawnPoints;
    this.totalWeight = spawnPoints.reduce((sum, point) => sum + point.weight, 0);
    if (difficultyConfig) {
      this.difficultyConfig = { ...this.difficultyConfig, ...difficultyConfig };
    }
    this.reset();
  }

  /**
   * Set the spawn pattern for enemies
   */
  setSpawnPattern(pattern: 'random' | 'sequential' | 'synchronized'): void {
    this.spawnPattern = pattern;
    this.currentSpawnIndex = 0;
  }

  /**
   * Reset the wave system to its initial state
   */
  reset(): void {
    this.currentWave = 0;
    this.enemiesRemaining = [];
    this.lastSpawnTime = 0;
    this.waveStartTime = 0;
    this.isWaveActive = false;
    this.currentDifficultyMultiplier = 1;
    this.currentSpawnIndex = 0;
  }

  /**
   * Calculate current difficulty multiplier based on wave number and player count
   */
  private calculateDifficultyMultiplier(): number {
    const playerCount = this.getPlayerCount();
    const waveScaling = this.currentWave * this.difficultyConfig.waveScaling;
    const playerScaling = (playerCount - 1) * this.difficultyConfig.playerScaling;
    const waveConfig = this.waves[this.currentWave];

    // Base multiplier affected by wave number and player count
    let multiplier = 1 + waveScaling + playerScaling;

    // Apply wave-specific multiplier if defined
    if (waveConfig.difficultyMultiplier) {
      multiplier *= waveConfig.difficultyMultiplier;
    }

    return multiplier;
  }

  /**
   * Get the number of players in the game
   */
  private getPlayerCount(): number {
    return this.world.getEntities().filter(entity => entity.hasComponent('player')).length;
  }

  /**
   * Get spawn position based on current pattern
   */
  private getSpawnPosition(): Vector2 {
    switch (this.spawnPattern) {
      case 'sequential':
        const point = this.spawnPoints[this.currentSpawnIndex];
        this.currentSpawnIndex = (this.currentSpawnIndex + 1) % this.spawnPoints.length;
        return point.position;

      case 'synchronized':
        return this.spawnPoints[this.currentSpawnIndex].position;

      case 'random':
      default:
        return this.getRandomSpawnPoint();
    }
  }

  /**
   * Start the next wave if available
   */
  startNextWave(): boolean {
    if (this.currentWave >= this.waves.length) {
      return false;
    }

    const wave = this.waves[this.currentWave];
    this.enemiesRemaining = [...wave.enemies];
    this.waveStartTime = performance.now();
    this.lastSpawnTime = this.waveStartTime;
    this.isWaveActive = true;

    // Calculate new difficulty multiplier for this wave
    this.currentDifficultyMultiplier = this.calculateDifficultyMultiplier();

    // Reset spawn pattern index for synchronized spawning
    if (this.spawnPattern === 'synchronized') {
      this.currentSpawnIndex = 0;
    }

    return true;
  }

  /**
   * Get a random spawn point based on weight distribution
   */
  private getRandomSpawnPoint(): Vector2 {
    let random = Math.random() * this.totalWeight;
    for (const point of this.spawnPoints) {
      random -= point.weight;
      if (random <= 0) {
        return point.position;
      }
    }
    return this.spawnPoints[0].position; // Fallback
  }

  /**
   * Check if the current wave is complete
   */
  private isWaveComplete(): boolean {
    return this.enemiesRemaining.every(group => group.count === 0);
  }

  /**
   * Update the wave spawn system
   */
  update(deltaTime: number): void {
    const currentTime = performance.now();

    // If no wave is active, check if we should start the next wave
    if (!this.isWaveActive) {
      if (this.currentWave === 0 ||
        (currentTime - this.waveStartTime >= this.waves[this.currentWave - 1].waveDelay)) {
        this.startNextWave();
      }
      return;
    }

    // Update spawn timing based on deltaTime
    const elapsedTime = currentTime - this.lastSpawnTime;

    // Check if it's time to spawn new enemies
    const wave = this.waves[this.currentWave];
    if (elapsedTime >= wave.spawnDelay) {
      // For synchronized spawning, spawn one enemy at each spawn point
      if (this.spawnPattern === 'synchronized') {
        const enemyGroup = this.enemiesRemaining.find(group => group.count > 0);
        if (enemyGroup && this.currentSpawnIndex < this.spawnPoints.length) {
          this.spawnEnemy(enemyGroup.type, this.spawnPoints[this.currentSpawnIndex].position);
          enemyGroup.count--;
          this.currentSpawnIndex++;

          // Reset index after using all spawn points
          if (this.currentSpawnIndex >= this.spawnPoints.length) {
            this.currentSpawnIndex = 0;
            this.lastSpawnTime = currentTime;
          }
        }
      } else {
        // Regular spawning (random or sequential)
        const enemyGroup = this.enemiesRemaining.find(group => group.count > 0);
        if (enemyGroup) {
          this.spawnEnemy(enemyGroup.type, this.getSpawnPosition());
          enemyGroup.count--;
          this.lastSpawnTime = currentTime;
        }
      }

      // Check if wave is complete
      if (this.isWaveComplete()) {
        this.isWaveActive = false;
        this.currentWave++;
      }
    }
  }

  /**
   * Spawn an enemy with current difficulty multiplier applied
   */
  private spawnEnemy(type: EnemyType, position: Vector2): void {
    const spawnOptions: EnemySpawnOptions = {
      position,
      type,
      difficultyMultiplier: this.currentDifficultyMultiplier
    };

    // Find closest player for AI targeting
    const players = this.world.getEntities().filter(entity => entity.hasComponent('player'));
    if (players.length > 0) {
      const closestPlayer = this.findClosestPlayer(position, players);
      const playerTransform = closestPlayer.getComponent('transform') as Transform;
      if (playerTransform) {
        const playerPos = playerTransform.getPosition();
        spawnOptions.aiTarget = {
          x: playerPos.x,
          y: playerPos.y,
          type: 'player'
        };
      }
    }

    const enemy = EnemyFactory.createEnemy(spawnOptions);
    this.world.addEntity(enemy);
  }

  /**
   * Find the closest player to a position
   */
  private findClosestPlayer(position: Vector2, players: Entity[]): Entity {
    let closestPlayer = players[0];
    let closestDistance = Infinity;

    players.forEach(player => {
      const transform = player.getComponent('transform') as Transform;
      if (transform) {
        const playerPos = transform.getPosition();
        const distance = Math.sqrt(
          Math.pow(playerPos.x - position.x, 2) +
          Math.pow(playerPos.y - position.y, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = player;
        }
      }
    });

    return closestPlayer;
  }

  /**
   * Get the current wave number (1-based)
   */
  getCurrentWave(): number {
    return this.currentWave + 1;
  }

  /**
   * Get the total number of waves
   */
  getTotalWaves(): number {
    return this.waves.length;
  }

  /**
   * Check if all waves have been completed
   */
  isComplete(): boolean {
    return this.currentWave >= this.waves.length && !this.isWaveActive;
  }

  /**
   * Get the remaining enemies in the current wave
   */
  getRemainingEnemies(): number {
    return this.enemiesRemaining.reduce((sum, group) => sum + group.count, 0);
  }

  /**
   * Get the current difficulty multiplier
   */
  getCurrentDifficultyMultiplier(): number {
    return this.currentDifficultyMultiplier;
  }
} 