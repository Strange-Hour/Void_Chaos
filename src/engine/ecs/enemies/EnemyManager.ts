import { Entity } from '../Entity';

// Simple event type
interface EnemyEventCallback {
  (entity: Entity): void;
}
interface AllDefeatedCallback {
  (): void;
}

export class EnemyManager {
  private static instance: EnemyManager;
  private enemies: Set<Entity> = new Set();
  private onSpawnCallbacks: EnemyEventCallback[] = [];
  private onDeathCallbacks: EnemyEventCallback[] = [];
  private onAllDefeatedCallbacks: AllDefeatedCallback[] = [];

  private constructor() { }

  static getInstance(): EnemyManager {
    if (!EnemyManager.instance) {
      EnemyManager.instance = new EnemyManager();
    }
    return EnemyManager.instance;
  }

  addEnemy(entity: Entity): void {
    this.enemies.add(entity);
    this.onSpawnCallbacks.forEach(cb => cb(entity));
  }

  removeEnemy(entity: Entity): void {
    if (this.enemies.delete(entity)) {
      this.onDeathCallbacks.forEach(cb => cb(entity));
      if (this.enemies.size === 0) {
        this.onAllDefeatedCallbacks.forEach(cb => cb());
      }
    }
  }

  getAllEnemies(): Entity[] {
    return Array.from(this.enemies);
  }

  getEnemyCount(): number {
    return this.enemies.size;
  }

  onEnemySpawned(cb: EnemyEventCallback): void {
    this.onSpawnCallbacks.push(cb);
  }

  onEnemyKilled(cb: EnemyEventCallback): void {
    this.onDeathCallbacks.push(cb);
  }

  onAllEnemiesDefeated(cb: AllDefeatedCallback): void {
    this.onAllDefeatedCallbacks.push(cb);
  }

  // Example query: find closest enemy to a position
  findClosestEnemy(x: number, y: number): Entity | null {
    let closest: Entity | null = null;
    let minDist = Infinity;
    // Convert Set to Array for iteration compatibility
    const enemiesArray = Array.from(this.enemies);
    for (const enemy of enemiesArray) {
      if (!enemy.hasComponent('transform')) continue;
      const transform = enemy.getComponent('transform');
      if (!transform || typeof (transform as unknown as { getPosition: () => { x: number; y: number } }).getPosition !== 'function') continue;
      const pos = (transform as unknown as { getPosition: () => { x: number; y: number } }).getPosition();
      const dx = pos.x - x;
      const dy = pos.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  /**
   * Returns a mapping of enemy type IDs to their current count
   */
  getEnemyTypeCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    const enemiesArray = Array.from(this.enemies);
    for (const enemy of enemiesArray) {
      if (!enemy.hasComponent('enemy')) continue;
      const enemyComponent = enemy.getComponent('enemy');
      if (!enemyComponent || typeof (enemyComponent as unknown as { getEnemyTypeId: () => string }).getEnemyTypeId !== 'function') continue;
      const typeId = (enemyComponent as unknown as { getEnemyTypeId: () => string }).getEnemyTypeId();
      counts[typeId] = (counts[typeId] || 0) + 1;
    }
    return counts;
  }
} 