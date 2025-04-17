import { CollisionSystem } from './CollisionSystem';
import { World } from '../World';
import { Entity } from '../Entity';
import { Transform } from '../components/Transform';
import { Collider } from '../components/Collider';
import { Enemy } from '../components/Enemy';
import { Player } from '../components/Player';
import { Health } from '../components/Health';

describe('CollisionSystem', () => {
  let world: World;
  let collisionSystem: CollisionSystem;
  let playerEntity: Entity;
  let enemyEntity: Entity;

  beforeEach(() => {
    // Create a new world for each test
    world = new World();

    // Create the collision system
    collisionSystem = new CollisionSystem(world);

    // Create a player entity
    playerEntity = new Entity();
    playerEntity.addComponent(new Player());
    playerEntity.addComponent(new Transform());
    playerEntity.addComponent(new Collider({
      width: 32,
      height: 32,
      offset: { x: -16, y: -16 }
    }));
    playerEntity.addComponent(new Health({ maxHealth: 100 }));

    // Create an enemy entity
    enemyEntity = new Entity();
    enemyEntity.addComponent(new Enemy());
    enemyEntity.addComponent(new Transform());
    enemyEntity.addComponent(new Collider({
      width: 32,
      height: 32,
      offset: { x: -16, y: -16 }
    }));

    // Add entities to the world
    world.addEntity(playerEntity);
    world.addEntity(enemyEntity);
  });

  describe('collision detection', () => {
    it('should detect collision between overlapping entities', () => {
      // Position entities so they overlap
      const playerTransform = playerEntity.getComponent('transform') as Transform;
      const enemyTransform = enemyEntity.getComponent('transform') as Transform;

      playerTransform.setPosition({ x: 0, y: 0 });
      enemyTransform.setPosition({ x: 10, y: 10 }); // Will overlap with player

      // Spy on the handleCollision method
      const handleCollisionSpy = jest.spyOn(
        collisionSystem as unknown as { handleCollision: (entity1: Entity, entity2: Entity) => void },
        'handleCollision'
      );

      // Update the collision system
      collisionSystem.update();

      // Check if handleCollision was called with the player and enemy entities
      expect(handleCollisionSpy).toHaveBeenCalled();
      const calls = handleCollisionSpy.mock.calls;

      // Check that our entities were involved in a collision
      const entitiesCollided = calls.some(call => {
        return (
          (call[0] === playerEntity && call[1] === enemyEntity) ||
          (call[0] === enemyEntity && call[1] === playerEntity)
        );
      });

      expect(entitiesCollided).toBe(true);
    });

    it('should not detect collision between distant entities', () => {
      // Position entities far apart
      const playerTransform = playerEntity.getComponent('transform') as Transform;
      const enemyTransform = enemyEntity.getComponent('transform') as Transform;

      playerTransform.setPosition({ x: 0, y: 0 });
      enemyTransform.setPosition({ x: 100, y: 100 }); // Far from player

      // Spy on the handleCollision method
      const handleCollisionSpy = jest.spyOn(
        collisionSystem as unknown as { handleCollision: (entity1: Entity, entity2: Entity) => void },
        'handleCollision'
      );

      // Update the collision system
      collisionSystem.update();

      // Check that handleCollision was not called with these entities
      const calls = handleCollisionSpy.mock.calls;

      // Check that our entities were not involved in a collision
      const entitiesCollided = calls.some(call => {
        return (
          (call[0] === playerEntity && call[1] === enemyEntity) ||
          (call[0] === enemyEntity && call[1] === playerEntity)
        );
      });

      expect(entitiesCollided).toBe(false);
    });
  });

  describe('collision callbacks', () => {
    it('should apply damage to player when colliding with enemy', () => {
      // Position entities so they overlap
      const playerTransform = playerEntity.getComponent('transform') as Transform;
      const enemyTransform = enemyEntity.getComponent('transform') as Transform;
      const playerHealth = playerEntity.getComponent('health') as Health;
      const enemy = enemyEntity.getComponent('enemy') as Enemy;

      playerTransform.setPosition({ x: 0, y: 0 });
      enemyTransform.setPosition({ x: 10, y: 10 }); // Will overlap with player

      // Mock the attack method to always return a specific damage value
      const mockDamage = 15;
      jest.spyOn(enemy, 'canAttack').mockReturnValue(true);
      jest.spyOn(enemy, 'attack').mockReturnValue(mockDamage);

      // Record initial health
      const initialHealth = playerHealth.getCurrentHealth();

      // Update the collision system
      collisionSystem.update();

      // Check if player health was reduced
      expect(playerHealth.getCurrentHealth()).toBe(initialHealth - mockDamage);
    });

    it('should respect layer collision matrix', () => {
      // Set up collision layers
      const playerCollider = playerEntity.getComponent('collider') as Collider;
      const enemyCollider = enemyEntity.getComponent('collider') as Collider;

      playerCollider.setLayer(1);
      enemyCollider.setLayer(2);

      // Position entities so they would overlap
      const playerTransform = playerEntity.getComponent('transform') as Transform;
      const enemyTransform = enemyEntity.getComponent('transform') as Transform;

      playerTransform.setPosition({ x: 0, y: 0 });
      enemyTransform.setPosition({ x: 10, y: 10 });

      // Set layers 1 and 2 to not collide
      collisionSystem.setLayerCollision(1, 2, false);

      // Spy on the handleCollision method
      const handleCollisionSpy = jest.spyOn(
        collisionSystem as unknown as { handleCollision: (entity1: Entity, entity2: Entity) => void },
        'handleCollision'
      );

      // Update the collision system
      collisionSystem.update();

      // Check that handleCollision was not called with these entities
      const calls = handleCollisionSpy.mock.calls;

      // Check that our entities were not involved in a collision
      const entitiesCollided = calls.some(call => {
        return (
          (call[0] === playerEntity && call[1] === enemyEntity) ||
          (call[0] === enemyEntity && call[1] === playerEntity)
        );
      });

      expect(entitiesCollided).toBe(false);
    });
  });
}); 