/**
 * Base class for all game entities in the ECS architecture.
 * An entity is essentially just an ID and a container for components.
 */
export class Entity {
  private static nextId = 0;
  private id: number;
  private components: Map<string, Component>;

  constructor() {
    this.id = Entity.nextId++;
    this.components = new Map();
  }

  /**
   * Get the unique identifier for this entity
   */
  getId(): number {
    return this.id;
  }

  /**
   * Add a component to this entity
   * @param component The component to add
   */
  addComponent(component: Component): void {
    this.components.set(component.getType(), component);
  }

  /**
   * Remove a component from this entity
   * @param type The type of component to remove
   */
  removeComponent(type: string): void {
    this.components.delete(type);
  }

  /**
   * Get a component by type
   * @param type The type of component to get
   * @returns The component if it exists, undefined otherwise
   */
  getComponent(type: string): Component | undefined {
    return this.components.get(type);
  }

  /**
   * Check if this entity has a component
   * @param type The type of component to check for
   */
  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Get all components attached to this entity
   */
  getComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Clean up this entity and its components
   */
  dispose(): void {
    this.components.clear();
  }

  /**
   * Create a serializable representation of this entity
   */
  serialize(): object {
    const componentData: { [key: string]: object } = {};
    this.components.forEach((component, type) => {
      componentData[type] = component.serialize();
    });
    return {
      id: this.id,
      components: componentData
    };
  }

  /**
   * Restore entity state from serialized data
   */
  deserialize(data: { id: number; components: { [key: string]: object } }): void {
    this.id = data.id;
    this.components.clear();

    // Update next ID if necessary to maintain uniqueness
    if (data.id >= Entity.nextId) {
      Entity.nextId = data.id + 1;
    }

    // Restore components (requires component factories or registry)
    // This is a simplified version - in practice, you'd need a way to
    // create the appropriate component types from the serialized data
    Object.entries(data.components).forEach(([type, componentData]) => {
      const component = this.createComponent(type);
      if (component) {
        component.deserialize(componentData);
        this.addComponent(component);
      }
    });
  }

  /**
   * Create a component of the specified type
   * This is a placeholder - in practice, you'd have a component registry
   * or factory system to create the appropriate component types
   * @param _type The type of component to create (unused in base implementation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private createComponent(_type: string): Component | undefined {
    // This would be implemented by game-specific code
    // to create the appropriate component types
    return undefined;
  }
}

/**
 * Base class for all components in the ECS architecture.
 * Components are pure data containers that can be attached to entities.
 */
export abstract class Component {
  /**
   * Get the type identifier for this component
   */
  abstract getType(): string;

  /**
   * Create a serializable representation of this component
   */
  abstract serialize(): object;

  /**
   * Restore component state from serialized data
   * @param data The serialized data to restore from
   */
  abstract deserialize(data: object): void;
} 