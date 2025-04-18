import { Component, Entity } from '../Entity';
import { Vector2 } from '../../math/Vector2';
import { MovementPatternDefinition } from '../ai/patterns/types';

export interface AIBehavior {
  name: string;
  update: (deltaTime: number) => void;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface AITarget {
  position: Vector2;
  entity?: Entity;
}

/**
 * AI component for handling entity behavior
 */
export class AI extends Component {
  private behaviors: Map<string, AIBehavior>;
  private availablePatterns: Record<string, MovementPatternDefinition>;
  private currentPatternId: string | null;
  private target: AITarget | null;
  private stateTime: number;

  constructor() {
    super();
    this.behaviors = new Map();
    this.availablePatterns = {};
    this.currentPatternId = null;
    this.target = null;
    this.stateTime = 0;
  }

  getType(): string {
    return 'ai';
  }

  /**
   * Add a behavior to this AI component
   */
  addBehavior(behavior: AIBehavior): void {
    this.behaviors.set(behavior.name, behavior);
  }

  /**
   * Remove a behavior from this AI component
   */
  removeBehavior(name: string): void {
    this.behaviors.delete(name);
  }

  /**
   * Get a behavior by name
   */
  getBehavior(name: string): AIBehavior | undefined {
    return this.behaviors.get(name);
  }

  /**
   * Get the ID of the current movement pattern
   */
  getCurrentPatternId(): string | null {
    return this.currentPatternId;
  }

  /**
   * Get the definition object for the current movement pattern
   */
  getCurrentPatternDefinition(): MovementPatternDefinition | undefined {
    return this.currentPatternId ? this.availablePatterns[this.currentPatternId] : undefined;
  }

  /**
   * Get time spent in current pattern state
   */
  getStateTime(): number {
    return this.stateTime;
  }

  /**
   * Set the available movement patterns for this AI.
   * This is typically done once when the entity is created.
   * @param patterns A record mapping pattern IDs to their definitions.
   */
  setAvailablePatterns(patterns: Record<string, MovementPatternDefinition>): void {
    this.availablePatterns = patterns;
  }

  /**
   * Get the available movement patterns.
   */
  getAvailablePatterns(): Record<string, MovementPatternDefinition> {
    return this.availablePatterns;
  }

  /**
   * Change to a new movement pattern state
   * @param patternId The ID of the pattern to switch to (must exist in availablePatterns)
   */
  setCurrentPatternId(patternId: string | null): void {
    if (patternId === this.currentPatternId) return;

    if (patternId !== null && !this.availablePatterns[patternId]) {
      console.warn(`Attempted to set unknown pattern ID: ${patternId}. Available:`, Object.keys(this.availablePatterns));
      return;
    }

    this.currentPatternId = patternId;
    this.stateTime = 0;

    const newPatternDef = this.getCurrentPatternDefinition();
    if (newPatternDef?.type === 'idle') {
      // Consider clearing target on switching to idle, or let AI system handle?
      // this.setTarget(null); // Example
    }
  }

  /**
   * Set the current target
   */
  setTarget(target: AITarget | null): void {
    if (target) {
      if (!this.target) {
        this.target = {
          position: { ...target.position },
          entity: target.entity
        };
      } else {
        this.target.position.x = target.position.x;
        this.target.position.y = target.position.y;
        this.target.entity = target.entity;
      }
    } else {
      this.target = null;
    }
  }

  /**
   * Get the current target
   */
  getTarget(): AITarget | null {
    return this.target;
  }

  /**
   * Update the AI behavior
   */
  update(deltaTime: number): void {
    this.stateTime += deltaTime;
  }

  serialize(): object {
    return {
      currentPatternId: this.currentPatternId,
      stateTime: this.stateTime,
      target: this.target ? { position: { ...this.target.position }, entityId: this.target.entity?.getId() } : null,
      availablePatterns: this.availablePatterns
    };
  }

  deserialize(data: {
    currentPatternId?: string | null;
    stateTime?: number;
    target?: { position: Vector2; entityId?: string | number } | null;
    availablePatterns?: Record<string, MovementPatternDefinition>;
  }): void {
    if (data.availablePatterns) {
      this.setAvailablePatterns(data.availablePatterns);
    }
    if (data.currentPatternId !== undefined) {
      if (data.currentPatternId === null || this.availablePatterns[data.currentPatternId]) {
        this.setCurrentPatternId(data.currentPatternId);
      } else {
        console.warn(`Deserialization: Invalid pattern ID '${data.currentPatternId}' found.`);
        this.setCurrentPatternId(Object.keys(this.availablePatterns)[0] || null);
      }
    }
    if (typeof data.stateTime === 'number') {
      this.stateTime = data.stateTime;
    }
    if (data.target !== undefined) {
      if (data.target === null) {
        this.setTarget(null);
      } else {
        this.target = {
          position: { ...data.target.position },
          entity: undefined
        };
      }
    }
  }
} 