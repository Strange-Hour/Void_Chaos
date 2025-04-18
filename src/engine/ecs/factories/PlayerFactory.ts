import { Entity } from '../Entity';
import { Transform } from '../components/Transform';
import { Renderer } from '../components/Renderer';
import { CharacterController } from '../components/CharacterController';
import { Player } from '../components/Player';
import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Sprite } from '@engine/Sprite';

export function createPlayer(sprite: Sprite, screenWidth: number, screenHeight: number): Entity {
  const player = new Entity();

  // Get sprite dimensions to correctly position the player
  const dimensions = sprite.getDimensions();

  // Add transform component - position is at the center of the screen
  const transform = new Transform();
  transform.setPosition({
    x: screenWidth / 2,
    y: screenHeight / 2
  });
  player.addComponent(transform);

  // Add renderer component
  const renderer = new Renderer(sprite);
  renderer.setZIndex(10); // Ensure player is drawn above other entities
  player.addComponent(renderer);

  // Add character controller with improved parameters for better movement
  const controller = new CharacterController({
    maxSpeed: 300,
    acceleration: 2000,
    deceleration: 1500,
  });
  player.addComponent(controller);

  // Add player component to identify as player
  player.addComponent(new Player());

  // Add collider component for collision detection
  const collider = new Collider(
    {
      width: 32,
      height: 32,
      offset: { x: -16, y: -16 }, // Center collider on player
    },
    {
      layer: 1, // Player is on layer 1
      isTrigger: false,
      isStatic: false,
    }
  );
  player.addComponent(collider);

  // Add health component
  const health = new Health({ maxHealth: 100 });
  player.addComponent(health);

  // Set an initial aim direction to test debug visualization
  const playerController = player.getComponent(
    "character-controller"
  ) as CharacterController;
  if (playerController) {
    // Only set aim direction initially; remove default movement to prevent drifting
    playerController.setAimDirection({ x: 1, y: 0 });
  }

  return player;
} 