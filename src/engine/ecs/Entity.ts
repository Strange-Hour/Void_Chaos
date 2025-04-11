/**
 * Base class for all game entities in the ECS architecture.
 * An entity is essentially just an ID and a container for components.
 */
export class Entity {
  private static nextId = 0;
  private readonly id: number;
  private components: Map<string, Component>;

  constructor(id?: number) {
    this.id = id ?? Entity.nextId++;
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
  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T;
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
  getAllComponents(): Component[] {
    return Array.from(this.components.values());
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