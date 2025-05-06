import { Entity } from '../Entity';
import { Transform } from '../components/Transform';
import { Collider } from '../components/Collider';
// import { Renderer } from '../components/Renderer'; // Uncomment if you want to add visuals

/**
 * Creates a static obstacle entity (e.g., wall, block) at the given position and size.
 * The obstacle will block movement and be marked as non-walkable in the grid.
 * @param x X position (center of obstacle)
 * @param y Y position (center of obstacle)
 * @param width Width of the obstacle
 * @param height Height of the obstacle
 */
export function createObstacle(x: number, y: number, width: number, height: number): Entity {
  const entity = new Entity();
  entity.addComponent(new Transform({ x, y }));
  entity.addComponent(new Collider(
    { width, height, offset: { x: -width / 2, y: -height / 2 } },
    { isStatic: true, isTrigger: false }
  ));
  // Optionally add a renderer for visual feedback:
  // entity.addComponent(new Renderer({ ... }));
  return entity;
} 