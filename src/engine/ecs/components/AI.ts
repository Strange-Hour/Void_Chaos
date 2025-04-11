import { Component } from '../Entity';
import { Vector2 } from './Transform';

export type AIState = string;

export interface AIBehavior {
  name: string;
  update: (deltaTime: number) => void;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface AITarget {
  position: Vector2;
  type: string;
}

/**
 * AI component for handling entity behavior
 */
export class AI extends Component {
  private behaviors: Map<string, AIBehavior>;
  private currentState: AIState | null;
  private target: AITarget | null;
  private stateTime: number;

  constructor() {
    super();
    this.behaviors = new Map();
    this.currentState = null;
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
   * Get the current behavior state
   */
  getCurrentState(): AIState | null {
    return this.currentState;
  }

  /**
   * Get time spent in current state
   */
  getStateTime(): number {
    return this.stateTime;
  }

  /**
   * Change to a new behavior state
   */
  setState(state: AIState | null): void {
    if (state === this.currentState) return;

    // Exit current state
    if (this.currentState) {
      const currentBehavior = this.behaviors.get(this.currentState);
      currentBehavior?.onExit?.();
    }

    // Enter new state
    this.currentState = state;
    this.stateTime = 0;

    if (state) {
      const newBehavior = this.behaviors.get(state);
      newBehavior?.onEnter?.();
    }
  }

  /**
   * Set the current target
   */
  setTarget(target: AITarget | null): void {
    this.target = target ? { ...target } : null;
  }

  /**
   * Get the current target
   */
  getTarget(): AITarget | null {
    return this.target ? { ...this.target } : null;
  }

  /**
   * Update the AI behavior
   */
  update(deltaTime: number): void {
    if (this.currentState) {
      const behavior = this.behaviors.get(this.currentState);
      if (behavior) {
        behavior.update(deltaTime);
      }
      this.stateTime += deltaTime;
    }
  }

  serialize(): object {
    return {
      currentState: this.currentState,
      stateTime: this.stateTime,
      target: this.target,
      behaviors: Array.from(this.behaviors.keys())
    };
  }

  deserialize(data: {
    currentState?: AIState | null;
    stateTime?: number;
    target?: AITarget | null;
    behaviors?: string[];
  }): void {
    if (data.currentState !== undefined) {
      this.setState(data.currentState);
    }
    if (typeof data.stateTime === 'number') {
      this.stateTime = data.stateTime;
    }
    if (data.target !== undefined) {
      this.setTarget(data.target);
    }
    // Note: Behaviors need to be re-added manually as they contain functions
  }
} 