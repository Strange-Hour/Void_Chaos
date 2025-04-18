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
import { LayerName, getLayerLevel } from '@/config';

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

    // Create debug layer using configuration
    const layer = this.canvas.createLayer(LayerName.Debug, {
      zIndex: getLayerLevel(LayerName.Debug)
    });
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
        const controller = entity.getComponent('character-controller') as CharacterController;

        if (renderer.isVisible()) {
          const sprite = renderer.getSprite();
          const position = transform.getPosition();
          const dimensions = sprite.getDimensions();
          const drawX = position.x - dimensions.width / 2;
          const drawY = position.y - dimensions.height / 2;
          const velocity = controller.getVelocity();

          // Save context state
          this.debugLayer.save();

          // Determine entity type and color scheme
          let mainColor = '#22c55e'; // Default green
          if (entity.hasComponent('enemy')) {
            const enemy = entity.getComponent('enemy') as Enemy;
            switch (enemy.getEnemyTypeId()) {
              case 'ranged':
                mainColor = '#eab308'; // Yellow for ranged
                break;
              case 'flanker':
                mainColor = '#ec4899'; // Pink for flanker
                break;
              case 'bomber':
                mainColor = '#f97316'; // Orange for bomber
                break;
              default:
                mainColor = '#ef4444'; // Red for basic
            }
          }

          if (!sprite.isReady()) {
            // Draw loading state
            this.drawEntityOutline(drawX, drawY, dimensions.width, dimensions.height, '#94a3b8', true);
            this.drawDebugBadge('Loading...', drawX + dimensions.width / 2, drawY - 8, '#94a3b8');
          } else {
            // Draw active entity outline
            this.drawEntityOutline(drawX, drawY, dimensions.width, dimensions.height, mainColor);

            // Calculate base spacing
            const verticalSpacing = 24; // Spacing between elements
            const horizontalOffset = dimensions.width * 1.8; // Side distance
            const nameOffset = dimensions.height / 2 + 16; // Small gap above entity
            const bottomOffset = dimensions.height / 2 + 16; // Distance below entity

            // Entity type (just above entity, centered)
            const entityType = entity.hasComponent('enemy')
              ? (entity.getComponent('enemy') as Enemy).getEnemyTypeId()
              : (entity.hasComponent('player') ? 'player' : 'unknown');

            // Draw entity type just above the entity
            this.drawDebugBadge(
              entityType,
              position.x,
              position.y - nameOffset,
              mainColor
            );

            // Health bar and text (below entity)
            if (entity.hasComponent('health')) {
              const health = entity.getComponent('health') as Health;
              const barWidth = dimensions.width + 16;
              const barHeight = 4;
              const barY = position.y + bottomOffset;

              // Health bar container
              this.debugLayer.fillStyle = 'rgba(0, 0, 0, 0.4)';
              this.debugLayer.filter = 'blur(0.5px)';
              this.debugLayer.beginPath();
              this.debugLayer.roundRect(
                position.x - barWidth / 2,
                barY - barHeight / 2,
                barWidth,
                barHeight,
                4
              );
              this.debugLayer.fill();

              // Health fill
              const healthPercent = health.getCurrentHealth() / health.getMaxHealth();
              const gradient = this.debugLayer.createLinearGradient(
                position.x - barWidth / 2,
                barY,
                position.x - barWidth / 2 + barWidth * healthPercent,
                barY
              );
              const healthColor = this.getHealthColor(health);
              gradient.addColorStop(0, healthColor);
              gradient.addColorStop(1, this.adjustColorBrightness(healthColor, 20));

              this.debugLayer.filter = 'none';
              this.debugLayer.fillStyle = gradient;
              this.debugLayer.beginPath();
              this.debugLayer.roundRect(
                position.x - barWidth / 2,
                barY - barHeight / 2,
                barWidth * healthPercent,
                barHeight,
                4
              );
              this.debugLayer.fill();

              // Health text below health bar
              this.drawDebugBadge(
                `${health.getCurrentHealth()}/${health.getMaxHealth()}`,
                position.x,
                barY + barHeight * 4,
                mainColor
              );
            }

            // Right side information (state and target)
            let rightY = position.y - dimensions.height / 2;
            if (entity.hasComponent('ai')) {
              const ai = entity.getComponent('ai') as AI;
              const patternId = ai.getCurrentPatternId();
              const target = ai.getTarget();

              // State badge (right side, starting at entity top)
              this.drawDebugBadge(
                patternId,
                position.x + horizontalOffset,
                rightY,
                mainColor
              );
              rightY += verticalSpacing;

              if (target) {
                // Draw target line
                this.drawTargetLine(
                  position.x,
                  position.y,
                  target.position.x,
                  target.position.y,
                  mainColor
                );

                // Target coordinates
                this.drawDebugBadge(
                  `${target.position.x.toFixed(0)}, ${target.position.y.toFixed(0)}`,
                  position.x + horizontalOffset,
                  rightY,
                  mainColor
                );
              }
            }

            // Left side information (velocity)
            if (velocity.x !== 0 || velocity.y !== 0) {
              // Draw velocity vector
              this.drawVelocityArrow(position, velocity, mainColor);

              // Velocity text (left side, at entity top)
              this.drawDebugBadge(
                `${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)}`,
                position.x - horizontalOffset,
                position.y - dimensions.height / 2,
                mainColor
              );
            }
          }

          // Restore context state
          this.debugLayer.restore();
        }
      }
    });
  }

  /**
   * Draws a translucent background for debug text
   */
  private drawTextBackground(x: number, y: number, width: number, height: number, alpha: number = 0.85): void {
    this.debugLayer.fillStyle = `rgba(17, 24, 39, ${alpha})`; // Tailwind gray-900 with opacity
    this.debugLayer.beginPath();
    this.debugLayer.roundRect(x - 4, y - height + 4, width + 8, height + 2, 6);
    this.debugLayer.fill();

    // Add subtle border
    this.debugLayer.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.debugLayer.lineWidth = 1;
    this.debugLayer.stroke();
  }

  /**
   * Draws a modern looking target line
   */
  private drawTargetLine(fromX: number, fromY: number, toX: number, toY: number, color: string = '#ffd700'): void {
    const gradient = this.debugLayer.createLinearGradient(fromX, fromY, toX, toY);
    gradient.addColorStop(0, `${color}99`); // Semi-transparent start
    gradient.addColorStop(1, `${color}33`); // More transparent end

    // Draw main line
    this.debugLayer.beginPath();
    this.debugLayer.strokeStyle = gradient;
    this.debugLayer.lineWidth = 2;
    this.debugLayer.setLineDash([8, 4]);
    this.debugLayer.moveTo(fromX, fromY);
    this.debugLayer.lineTo(toX, toY);
    this.debugLayer.stroke();

    // Draw glow effect
    this.debugLayer.strokeStyle = `${color}33`;
    this.debugLayer.lineWidth = 4;
    this.debugLayer.stroke();

    // Reset line style
    this.debugLayer.setLineDash([]);
  }

  /**
   * Draws a modern entity outline
   */
  private drawEntityOutline(x: number, y: number, width: number, height: number, color: string, isLoading: boolean = false): void {
    this.debugLayer.save();

    // Draw glow effect
    this.debugLayer.shadowColor = color;
    this.debugLayer.shadowBlur = 8;

    // Draw outline
    this.debugLayer.strokeStyle = color;
    this.debugLayer.lineWidth = 2;

    if (isLoading) {
      this.debugLayer.setLineDash([6, 4]);
    }

    // Draw rounded rectangle
    this.debugLayer.beginPath();
    this.debugLayer.roundRect(x, y, width, height, 4);
    this.debugLayer.stroke();

    // Add corner accents
    const accentLength = 6;
    const corners = [
      [x, y], // Top-left
      [x + width, y], // Top-right
      [x + width, y + height], // Bottom-right
      [x, y + height] // Bottom-left
    ];

    this.debugLayer.lineWidth = 3;
    corners.forEach(([cx, cy]) => {
      // Horizontal accent
      this.debugLayer.beginPath();
      this.debugLayer.moveTo(cx - (cx === x ? 0 : accentLength), cy);
      this.debugLayer.lineTo(cx + (cx === x ? accentLength : 0), cy);
      this.debugLayer.stroke();

      // Vertical accent
      this.debugLayer.beginPath();
      this.debugLayer.moveTo(cx, cy - (cy === y ? 0 : accentLength));
      this.debugLayer.lineTo(cx, cy + (cy === y ? accentLength : 0));
      this.debugLayer.stroke();
    });

    this.debugLayer.restore();
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
   * Draws debug text with background
   */
  private drawDebugText(text: string, x: number, y: number, color: string = '#fff', alpha: number = 0.85): void {
    // Convert this to use the new badge system
    this.drawDebugBadge(text, x, y + 10, color);
  }

  /**
   * Adjusts color brightness
   */
  private adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16)
      .slice(1);
  }

  /**
   * Get appropriate color based on health percentage with modern color palette
   */
  private getHealthColor(health: Health): string {
    const healthPercent = health.getCurrentHealth() / health.getMaxHealth();
    if (healthPercent > 0.7) return '#22c55e'; // Tailwind green-500
    if (healthPercent > 0.3) return '#eab308'; // Tailwind yellow-500
    return '#ef4444'; // Tailwind red-500
  }

  /**
   * Draws a modern badge with text
   */
  private drawDebugBadge(text: string | null, x: number, y: number, color: string): void {
    if (!text) return;

    const metrics = this.debugLayer.measureText(text);
    const padding = 6; // Reduced padding
    const height = 18; // Slightly smaller height

    // Center the badge on the provided coordinates
    const badgeX = x - metrics.width / 2 - padding;
    const badgeY = y - height / 2;

    // Draw badge background
    this.debugLayer.fillStyle = `rgba(17, 24, 39, 0.85)`;
    this.debugLayer.beginPath();
    this.debugLayer.roundRect(
      badgeX,
      badgeY,
      metrics.width + padding * 2,
      height,
      height / 2
    );
    this.debugLayer.fill();

    // Add subtle border
    this.debugLayer.strokeStyle = `${color}33`;
    this.debugLayer.lineWidth = 1;
    this.debugLayer.stroke();

    // Draw text
    this.debugLayer.fillStyle = color;
    this.debugLayer.font = '11px Inter, system-ui, sans-serif'; // Slightly smaller font
    this.debugLayer.fillText(text, badgeX + padding, badgeY + height / 2 + 4);
  }

  /**
   * Draws a velocity arrow
   */
  private drawVelocityArrow(position: { x: number; y: number }, velocity: { x: number; y: number }, color: string): void {
    const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    // Scale arrow length based on velocity magnitude
    // Base length of 30 pixels, scaled by velocity but capped between 20 and 60 pixels
    const minLength = 20;
    const maxLength = 60;
    const baseLength = 30;
    const scaleFactor = 0.5; // Adjust this to change how quickly the arrow grows
    const arrowLength = Math.min(maxLength, Math.max(minLength, baseLength * (velocityMagnitude * scaleFactor)));

    const normalizedVelX = velocity.x / velocityMagnitude;
    const normalizedVelY = velocity.y / velocityMagnitude;

    const arrowX = position.x + normalizedVelX * arrowLength;
    const arrowY = position.y + normalizedVelY * arrowLength;

    // Draw line with gradient
    const gradient = this.debugLayer.createLinearGradient(
      position.x, position.y,
      arrowX, arrowY
    );
    gradient.addColorStop(0, `${color}ff`);
    gradient.addColorStop(1, `${color}33`);

    this.debugLayer.strokeStyle = gradient;
    this.debugLayer.lineWidth = 2;
    this.debugLayer.beginPath();
    this.debugLayer.moveTo(position.x, position.y);
    this.debugLayer.lineTo(arrowX, arrowY);
    this.debugLayer.stroke();

    // Draw arrowhead with size proportional to arrow length
    const headLength = Math.min(12, arrowLength * 0.3); // Cap maximum head size
    const angle = Math.atan2(velocity.y, velocity.x);
    this.debugLayer.beginPath();
    this.debugLayer.moveTo(arrowX, arrowY);
    this.debugLayer.lineTo(
      arrowX - headLength * Math.cos(angle - Math.PI / 6),
      arrowY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.debugLayer.moveTo(arrowX, arrowY);
    this.debugLayer.lineTo(
      arrowX - headLength * Math.cos(angle + Math.PI / 6),
      arrowY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.debugLayer.stroke();
  }
} 