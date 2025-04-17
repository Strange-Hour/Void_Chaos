import { System } from '@engine/ecs/System';
import { Entity } from '@engine/ecs/Entity';
import { Transform } from '@engine/ecs/components/Transform';
import { AI } from '@engine/ecs/components/AI';
import { CharacterController } from '@engine/ecs/components/CharacterController';
import { Canvas } from '@engine/Canvas';
import { InputManager } from '../../input/InputManager';
import { InputAction, IInputEventSubscriber } from '../../input/types';
import { Renderer } from '../components/Renderer';
import { Enemy } from '../components/Enemy';
import { Health } from '../components/Health';

export class DebugSystem extends System implements IInputEventSubscriber {
  private canvas: Canvas;
  private debugEntities: Map<Entity, {
    transform: Transform;
    controller: CharacterController;
    ai?: AI;
    health?: Health;
  }>;
  private isEnabled: boolean = false;
  private inputManager: InputManager;
  private debugLayer: CanvasRenderingContext2D;
  private forceDrawEvenWhenDisabled: boolean = false;

  // Track all renderable entities for drawing outlines
  private renderableEntities: Set<Entity> = new Set();

  constructor(canvas: Canvas, inputManager: InputManager) {
    super(['transform', 'character-controller']);
    this.canvas = canvas;
    this.debugEntities = new Map();
    this.inputManager = inputManager;
    this.inputManager.subscribe(this);

    // Create debug layer above game layer
    const layer = this.canvas.createLayer('debug', { zIndex: 2 });
    if (!layer) {
      throw new Error('Failed to create debug layer');
    }
    this.debugLayer = layer.getContext();
  }

  onInputActionStart(action: InputAction): void {
    if (action === InputAction.Debug) {
      this.toggleDebug();
    }
  }

  dispose(): void {
    this.inputManager.unsubscribe(this);
  }

  addEntity(entity: Entity): void {
    super.addEntity(entity);

    // If entity was added successfully, add to debug entities map
    if (this.entities.has(entity)) {
      const transform = entity.getComponent('transform') as Transform;
      const controller = entity.getComponent('character-controller') as CharacterController;
      const ai = entity.getComponent('ai') as AI | undefined;
      const health = entity.getComponent('health') as Health | undefined;

      this.debugEntities.set(entity, { transform, controller, ai, health });

      console.log('DebugSystem: Added entity', {
        entityId: entity.getId(),
        hasTransform: !!transform,
        hasController: !!controller,
        hasAI: !!ai,
        hasHealth: !!health
      });

      // Force an update to draw targeting lines immediately when new AI entities are added
      this.update();
    }

    // If entity has a renderer, also track it for drawing outlines
    if (entity.hasComponent('renderer') && entity.hasComponent('transform')) {
      this.renderableEntities.add(entity);
    }
  }

  removeEntity(entity: Entity): void {
    super.removeEntity(entity);
    this.debugEntities.delete(entity);
    this.renderableEntities.delete(entity);

    // Force update after entity removal to clear old lines
    this.update();
  }

  toggleDebug(): void {
    this.isEnabled = !this.isEnabled;
    console.log(`Debug mode ${this.isEnabled ? 'enabled' : 'disabled'} (Press F1 to toggle)`);

    // Clear or draw based on new state
    if (!this.isEnabled) {
      // Always clear the debug layer when disabled
      this.debugLayer.clearRect(0, 0, this.canvas.getWidth(), this.canvas.getHeight());
    } else {
      // Force update to draw immediately when enabled
      this.update();
    }
  }

  /**
   * Force a debug draw cycle and log debugging info
   */
  forceDebugDraw(): void {
    console.log('Force debug draw called with isEnabled:', this.isEnabled);

    // Temporarily enable forced drawing
    this.forceDrawEvenWhenDisabled = true;

    // Call update to force drawing
    this.update();

    // Reset forced drawing flag
    this.forceDrawEvenWhenDisabled = false;

    // Log info about debug entities
    this.debugEntities.forEach(({ transform, controller, health }, entity) => {
      const position = transform.getPosition();
      const velocity = controller.getVelocity();
      const moveDir = controller.getMoveDirection();

      console.log('Debug entity:', {
        entityId: entity.getId(),
        position,
        velocity,
        moveDir,
        hasAI: entity.hasComponent('ai'),
        isPlayer: entity.hasComponent('player'),
        health: health ? `${health.getCurrentHealth()}/${health.getMaxHealth()}` : 'N/A'
      });
    });
  }

  update(): void {
    // Always update entities and references, only conditionally draw
    // This ensures we always have the freshest data for when debug is toggled on
    this.refreshEntityReferences();

    // Skip drawing if debug is disabled
    if (!this.isEnabled && !this.forceDrawEvenWhenDisabled) {
      // Clear any existing debug drawings
      this.debugLayer.clearRect(0, 0, this.canvas.getWidth(), this.canvas.getHeight());
      return;
    }

    // Clear previous debug drawings
    this.debugLayer.clearRect(0, 0, this.canvas.getWidth(), this.canvas.getHeight());

    // If not enabled and not forcing, exit after clearing
    if (!this.isEnabled && !this.forceDrawEvenWhenDisabled) {
      return;
    }

    // Draw debug grid
    this.drawDebugGrid();

    // Save context state
    this.debugLayer.save();

    // Set up debug drawing style
    this.debugLayer.lineWidth = 2;
    this.debugLayer.font = '12px monospace';

    // Get debug entities with fresh AI target information
    this.getFreshEntityInfo();

    // Draw entity outlines and labels
    this.drawEntityOutlines();

    // Draw debug info for each entity
    this.debugEntities.forEach(({ transform, controller, ai, health }) => {
      const position = transform.getPosition();
      const velocity = controller.getVelocity();
      const moveDir = controller.getMoveDirection();

      // Draw position and velocity
      this.debugLayer.fillStyle = '#00ff00';
      if (ai) {
        const state = ai.getCurrentState();
        const target = ai.getTarget();

        // Add timestamp to show refreshed data
        const timeStamp = new Date().toLocaleTimeString();
        this.debugLayer.fillText(`Updated: ${timeStamp}`, position.x + 20, position.y - 32);
        this.debugLayer.fillText(`State: ${state}`, position.x + 20, position.y - 20);
        this.debugLayer.fillText(`Vel: ${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}`, position.x + 20, position.y - 8);


        // Draw line to target if exists (yellow)
        if (target) {
          this.debugLayer.strokeStyle = '#ffff00';
          this.debugLayer.setLineDash([5, 5]);
          this.debugLayer.beginPath();
          this.debugLayer.moveTo(position.x, position.y);
          this.debugLayer.lineTo(target.position.x, target.position.y);
          this.debugLayer.stroke();
          this.debugLayer.setLineDash([]);

          // Add target position as text for debugging
          this.debugLayer.fillStyle = 'yellow';
          this.debugLayer.fillText(
            `Target: (${target.position.x.toFixed(0)}, ${target.position.y.toFixed(0)})`,
            position.x + 20,
            position.y + 4
          );
        }
      } else {
        // Player debug info
        this.debugLayer.fillText(`Player`, position.x + 20, position.y - 20);
        this.debugLayer.fillText(`Vel: ${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}`, position.x + 20, position.y - 8);


      }

      // Draw velocity vector (red)
      this.debugLayer.strokeStyle = '#ff0000';
      this.debugLayer.beginPath();
      this.debugLayer.moveTo(position.x, position.y);
      this.debugLayer.lineTo(position.x + velocity.x * 0.5, position.y + velocity.y * 0.5);
      this.debugLayer.stroke();

      // Draw move direction (blue)
      this.debugLayer.strokeStyle = '#0000ff';
      this.debugLayer.beginPath();
      this.debugLayer.moveTo(position.x, position.y);
      this.debugLayer.lineTo(position.x + moveDir.x * 30, position.y + moveDir.y * 30);
      this.debugLayer.stroke();

      // Draw entity bounds
      this.debugLayer.strokeStyle = '#00ff00';
      this.debugLayer.strokeRect(position.x - 16, position.y - 16, 32, 32);
    });

    // Restore context state
    this.debugLayer.restore();
  }

  /**
   * Draw outlines and labels for all renderable entities
   */
  private drawEntityOutlines(): void {
    this.renderableEntities.forEach(entity => {
      if (entity.hasComponent('transform') && entity.hasComponent('renderer')) {
        const transform = entity.getComponent('transform') as Transform;
        const renderer = entity.getComponent('renderer') as Renderer;

        if (renderer.isVisible()) {
          const sprite = renderer.getSprite();
          const position = transform.getPosition();
          const dimensions = sprite.getDimensions();
          const drawX = position.x - dimensions.width / 2;
          const drawY = position.y - dimensions.height / 2;

          if (!sprite.isReady()) {
            // Draw a red box to indicate missing sprite
            this.debugLayer.save();
            this.debugLayer.strokeStyle = 'red';
            this.debugLayer.lineWidth = 2;
            this.debugLayer.strokeRect(
              drawX,
              drawY,
              dimensions.width,
              dimensions.height
            );
            this.debugLayer.restore();
          } else {
            // Draw a highlight box around the sprite
            this.debugLayer.save();
            this.debugLayer.strokeStyle = 'lime';
            this.debugLayer.lineWidth = 2;
            this.debugLayer.strokeRect(
              drawX,
              drawY,
              dimensions.width,
              dimensions.height
            );

            // Add entity type label
            this.debugLayer.font = '10px Arial';
            this.debugLayer.fillStyle = 'lime';
            const entityType = entity.hasComponent('enemy')
              ? (entity.getComponent('enemy') as Enemy).getEnemyType()
              : (entity.hasComponent('player') ? 'player' : 'unknown');
            this.debugLayer.fillText(entityType, drawX, drawY - 5);

            // Add health info if available - MOVED BELOW ENTITY
            if (entity.hasComponent('health')) {
              const health = entity.getComponent('health') as Health;

              // Draw health bar below entity
              const barWidth = dimensions.width;
              const barHeight = 4; // Slightly taller for better visibility
              const barY = drawY + dimensions.height + 5; // Position below entity

              // Background
              this.debugLayer.fillStyle = 'rgba(0, 0, 0, 0.6)';
              this.debugLayer.fillRect(drawX, barY, barWidth, barHeight);

              // Health fill
              const healthPercent = health.getCurrentHealth() / health.getMaxHealth();
              this.debugLayer.fillStyle = this.getHealthColor(health);
              this.debugLayer.fillRect(drawX, barY, barWidth * healthPercent, barHeight);

              // Border
              this.debugLayer.strokeStyle = 'white';
              this.debugLayer.lineWidth = 0.5;
              this.debugLayer.strokeRect(drawX, barY, barWidth, barHeight);

              // Display numerical health for debug purposes
              if (this.isEnabled) {
                this.debugLayer.fillStyle = 'white';
                this.debugLayer.font = '9px Arial';
                this.debugLayer.fillText(
                  `${health.getCurrentHealth()}/${health.getMaxHealth()}`,
                  drawX + barWidth / 2 - 10,
                  barY + barHeight + 8
                );
              }
            }

            this.debugLayer.restore();
          }
        }
      }
    });
  }

  /**
   * Draws a debug grid to help visualize the game area
   */
  private drawDebugGrid(): void {
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();
    const gridSize = 50;

    this.debugLayer.save();
    this.debugLayer.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    this.debugLayer.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      this.debugLayer.beginPath();
      this.debugLayer.moveTo(x, 0);
      this.debugLayer.lineTo(x, height);
      this.debugLayer.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      this.debugLayer.beginPath();
      this.debugLayer.moveTo(0, y);
      this.debugLayer.lineTo(width, y);
      this.debugLayer.stroke();
    }

    // Draw center cross
    this.debugLayer.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    this.debugLayer.lineWidth = 2;

    const centerX = width / 2;
    const centerY = height / 2;

    this.debugLayer.beginPath();
    this.debugLayer.moveTo(centerX - 10, centerY);
    this.debugLayer.lineTo(centerX + 10, centerY);
    this.debugLayer.stroke();

    this.debugLayer.beginPath();
    this.debugLayer.moveTo(centerX, centerY - 10);
    this.debugLayer.lineTo(centerX, centerY + 10);
    this.debugLayer.stroke();

    this.debugLayer.restore();
  }

  /**
   * Get fresh entity info by directly accessing component data
   * This ensures we have the most up-to-date information
   */
  private getFreshEntityInfo(): void {
    // For each AI entity, get the fresh player position directly
    const playerEntities = Array.from(this.entities).filter(entity =>
      entity.hasComponent('player') && entity.hasComponent('transform')
    );

    if (playerEntities.length === 0) return;

    // Get the first player's position (assuming single player game)
    const playerEntity = playerEntities[0];
    const playerTransform = playerEntity.getComponent('transform') as Transform;
    const playerPosition = playerTransform.getPosition();

    // Directly update AI entity targets with fresh player position
    this.debugEntities.forEach(({ ai }) => {
      if (ai) {
        const target = ai.getTarget();
        if (target && target.entity && target.entity.getId() === playerEntity.getId()) {
          // Direct update to ensure target position is current
          target.position.x = playerPosition.x;
          target.position.y = playerPosition.y;
        }
      }
    });
  }

  /**
   * Refresh entity component references to ensure we always have the latest data
   */
  private refreshEntityReferences(): void {
    // Iterate through all debug entities and refresh their component references
    this.debugEntities.forEach((components, entity) => {
      // Get fresh AI component if it exists
      if (entity.hasComponent('ai')) {
        components.ai = entity.getComponent('ai') as AI;
      }

      // Get fresh health component if it exists
      if (entity.hasComponent('health')) {
        components.health = entity.getComponent('health') as Health;
      }

      // Refresh transform and controller references
      components.transform = entity.getComponent('transform') as Transform;
      components.controller = entity.getComponent('character-controller') as CharacterController;
    });
  }

  /**
   * Get appropriate color based on health percentage
   */
  private getHealthColor(health: Health): string {
    const healthPercent = health.getCurrentHealth() / health.getMaxHealth();
    if (healthPercent > 0.7) return 'lime';
    if (healthPercent > 0.3) return 'yellow';
    return 'red';
  }
} 