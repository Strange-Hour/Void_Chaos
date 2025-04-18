import { System } from '../System';
import { Entity } from '../Entity';
import { EnemyFactory, EnemySpawnOptions } from '../factories/EnemyFactory';
import { Vector2 } from '@engine/math/Vector2';
import { Transform } from '../components/Transform';
import { World } from '@engine/ecs/World';
import { EnemyRegistry } from '../enemies/EnemyRegistry';

export interface WaveConfig {
  enemies: {
    typeId: string;  // Changed from type: EnemyType
    count: number;
  }[];
  spawnDelay: number;  // Delay between spawning each enemy in ms
  waveDelay: number;   // Delay before starting next wave in ms
  difficultyMultiplier?: number; // Optional difficulty multiplier for this wave
}

export interface Boundary {
  width: number;
  height: number;
  padding: number;
}

export interface DifficultyConfig {
  baseHealth: number;
  baseDamage: number;
  baseSpeed: number;
  waveScaling: number;    // 10% increase per wave
  playerScaling: number;   // 30% increase per additional player
}

/**
 * System that manages wave-based enemy spawning
 */
export class WaveSpawnSystem extends System {
  private waves: WaveConfig[];
  private currentWave: number;
  private enemiesRemaining: { typeId: string; count: number }[];
  private lastSpawnTime: number;
  private waveStartTime: number;
  private isWaveActive: boolean;
  protected world: World;
  private difficultyConfig: DifficultyConfig;
  private currentDifficultyMultiplier: number;
  private spawnPattern: 'random' | 'sequential' | 'synchronized' = 'random';
  private currentSpawnSide: 'top' | 'right' | 'bottom' | 'left' = 'top';
  private boundary: Boundary;
  private debug: boolean = false;

  constructor(world: World) {
    super(['transform']);
    this.world = world;
    this.waves = [];
    this.currentWave = 0;
    this.enemiesRemaining = [];
    this.lastSpawnTime = 0;
    this.waveStartTime = 0;
    this.isWaveActive = false;
    this.currentDifficultyMultiplier = 1;
    this.boundary = { width: 800, height: 600, padding: 50 };
    this.difficultyConfig = {
      baseHealth: 1,
      baseDamage: 1,
      baseSpeed: 1,
      waveScaling: 0.1,
      playerScaling: 0.3,
    };
  }

  /**
   * Configure the wave spawning system with wave definitions and boundary
   */
  configure(waves: WaveConfig[], boundary: Boundary, difficultyConfig: DifficultyConfig): void {
    this.waves = waves;
    this.boundary = boundary;
    this.difficultyConfig = difficultyConfig;

    // Validate enemy types exist in registry
    const registry = EnemyRegistry.getInstance();
    waves.forEach(wave => {
      wave.enemies.forEach(enemy => {
        if (!registry.getEnemyType(enemy.typeId)) {
          console.warn(`Enemy type '${enemy.typeId}' not found in registry. Wave configuration may fail.`);
        }
      });
    });

    this.reset();
  }

  /**
   * Set the spawn pattern for enemies
   */
  setSpawnPattern(pattern: 'random' | 'sequential' | 'synchronized'): void {
    this.spawnPattern = pattern;
    this.currentSpawnSide = 'top';
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
    this.currentSpawnSide = 'top';
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
   * Get a random position along the specified boundary side
   */
  private getRandomBoundaryPosition(side?: 'top' | 'right' | 'bottom' | 'left'): Vector2 {
    const { width, height, padding } = this.boundary;
    const p = padding;

    // If no side specified, choose one randomly
    if (!side) {
      const sides: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
      side = sides[Math.floor(Math.random() * sides.length)];
    }

    switch (side) {
      case 'top':
        return {
          x: p + Math.random() * (width - 2 * p),
          y: p
        };
      case 'right':
        return {
          x: width - p,
          y: p + Math.random() * (height - 2 * p)
        };
      case 'bottom':
        return {
          x: p + Math.random() * (width - 2 * p),
          y: height - p
        };
      case 'left':
        return {
          x: p,
          y: p + Math.random() * (height - 2 * p)
        };
    }
  }

  /**
   * Get spawn position based on current pattern
   */
  private getSpawnPosition(): Vector2 {
    switch (this.spawnPattern) {
      case 'sequential':
        // Rotate through sides sequentially
        const position = this.getRandomBoundaryPosition(this.currentSpawnSide);
        const sides: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
        const currentIndex = sides.indexOf(this.currentSpawnSide);
        this.currentSpawnSide = sides[(currentIndex + 1) % sides.length];
        return position;

      case 'synchronized':
        // Spawn at evenly distributed points along all sides
        return this.getRandomBoundaryPosition(this.currentSpawnSide);

      case 'random':
      default:
        // Completely random boundary position
        return this.getRandomBoundaryPosition();
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

    return true;
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
      const enemyGroup = this.enemiesRemaining.find(group => group.count > 0);
      if (enemyGroup) {
        const spawnPosition = this.getSpawnPosition();
        this.spawnEnemy(enemyGroup.typeId, spawnPosition);
        enemyGroup.count--;

        // Add a small random variation to spawn timing based on deltaTime
        this.lastSpawnTime = currentTime + (Math.random() - 0.5) * deltaTime;
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
  private spawnEnemy(typeId: string, position: Vector2): void {
    // Find a valid spawn position that doesn't overlap with existing entities
    const validPosition = this.findValidSpawnPosition(position, typeId);

    const spawnOptions: EnemySpawnOptions = {
      position: validPosition,
      typeId,
      difficultyMultiplier: this.currentDifficultyMultiplier
    };

    // Find closest player for AI targeting
    const players = this.world.getEntities().filter(entity => entity.hasComponent('player'));
    if (players.length > 0) {
      const closestPlayer = this.findClosestPlayer(validPosition, players);
      const playerTransform = closestPlayer.getComponent('transform') as Transform;
      if (playerTransform) {
        const playerPos = playerTransform.getPosition();
        spawnOptions.aiTarget = {
          x: playerPos.x,
          y: playerPos.y,
          entity: closestPlayer
        };
      }
    }

    const enemy = EnemyFactory.createEnemy(spawnOptions);
    this.world.addEntity(enemy);

    if (this.debug) {
      console.log(`Spawned ${typeId} enemy at position (${validPosition.x.toFixed(1)}, ${validPosition.y.toFixed(1)})`);
    }
  }

  /**
   * Find a valid spawn position that doesn't overlap with existing entities
   * @param initialPosition The initially suggested spawn position
   * @param enemyType The type of enemy to spawn
   * @returns A valid position that doesn't overlap with other entities
   */
  private findValidSpawnPosition(initialPosition: Vector2, enemyType: string): Vector2 {
    // Set parameters for spawn position search
    const maxAttempts = 10;
    const minDistance = 60; // Minimum distance between entities (larger than collision boxes)
    const allEntities = this.world.getEntities();

    // Try the initial position first
    if (!this.isPositionNearEntities(initialPosition, allEntities, minDistance)) {
      return initialPosition;
    }

    // If the initial position is not valid, try alternative positions
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // On each attempt, try a position further from the edge
      const distanceFromEdge = this.boundary.padding + (attempt * 20);
      const { width, height } = this.boundary;

      // Try different sides based on the enemy type for better distribution
      let side: 'top' | 'right' | 'bottom' | 'left';

      switch (enemyType) {
        case 'Basic':
          // Basic enemies prefer top and bottom
          side = Math.random() < 0.5 ? 'top' : 'bottom';
          break;
        case 'Flanker':
          // Flankers prefer sides
          side = Math.random() < 0.5 ? 'left' : 'right';
          break;
        case 'Ranged':
          // Ranged enemies can be anywhere
          side = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)] as 'top' | 'right' | 'bottom' | 'left';
          break;
        default:
          side = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)] as 'top' | 'right' | 'bottom' | 'left';
      }

      // Get position with jitter
      let testPosition: Vector2;

      switch (side) {
        case 'top':
          testPosition = {
            x: distanceFromEdge + Math.random() * (width - 2 * distanceFromEdge),
            y: distanceFromEdge
          };
          break;
        case 'right':
          testPosition = {
            x: width - distanceFromEdge,
            y: distanceFromEdge + Math.random() * (height - 2 * distanceFromEdge)
          };
          break;
        case 'bottom':
          testPosition = {
            x: distanceFromEdge + Math.random() * (width - 2 * distanceFromEdge),
            y: height - distanceFromEdge
          };
          break;
        case 'left':
          testPosition = {
            x: distanceFromEdge,
            y: distanceFromEdge + Math.random() * (height - 2 * distanceFromEdge)
          };
          break;
      }

      // Check if this position is valid
      if (!this.isPositionNearEntities(testPosition, allEntities, minDistance)) {
        if (this.debug) {
          console.log(`Found valid spawn position on attempt ${attempt + 1}`);
        }
        return testPosition;
      }
    }

    // If we can't find a valid position after max attempts, add some random offset to original position
    // This is a fallback to prevent spawn failures
    const fallbackPosition = {
      x: initialPosition.x + (Math.random() * 100) - 50,
      y: initialPosition.y + (Math.random() * 100) - 50
    };

    // Ensure position is within boundaries
    fallbackPosition.x = Math.max(this.boundary.padding, Math.min(this.boundary.width - this.boundary.padding, fallbackPosition.x));
    fallbackPosition.y = Math.max(this.boundary.padding, Math.min(this.boundary.height - this.boundary.padding, fallbackPosition.y));

    if (this.debug) {
      console.log(`Using fallback spawn position after ${maxAttempts} failed attempts`);
    }

    return fallbackPosition;
  }

  /**
   * Check if a position is too close to any existing entity
   * @param position Position to check
   * @param entities Entities to check against
   * @param minDistance Minimum required distance
   * @returns True if the position is too close to an entity
   */
  private isPositionNearEntities(position: Vector2, entities: Entity[], minDistance: number): boolean {
    for (const entity of entities) {
      // Skip entities without transform
      if (!entity.hasComponent('transform')) {
        continue;
      }

      const transform = entity.getComponent('transform') as Transform;
      const entityPos = transform.getPosition();

      // Calculate distance
      const dx = position.x - entityPos.x;
      const dy = position.y - entityPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If too close, return true
      if (distance < minDistance) {
        return true;
      }
    }

    // No entities are too close
    return false;
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

  /**
   * Enable or disable debug logging
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }
} 