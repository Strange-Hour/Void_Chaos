import { Entity, Component } from './Entity';

// Mock component implementation for testing
class TestComponent extends Component {
  private value: number = 0;

  constructor(value: number = 0) {
    super();
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  setValue(value: number): void {
    this.value = value;
  }

  getType(): string {
    return 'test';
  }

  serialize(): object {
    return { value: this.value };
  }

  deserialize(data: { value?: number }): void {
    if (typeof data.value === 'number') {
      this.value = data.value;
    }
  }
}

describe('Entity', () => {
  let entity: Entity;
  let component: TestComponent;

  beforeEach(() => {
    entity = new Entity();
    component = new TestComponent(42);
  });

  it('should generate unique IDs for each entity', () => {
    const entity1 = new Entity();
    const entity2 = new Entity();
    expect(entity1.getId()).not.toBe(entity2.getId());
  });

  describe('component management', () => {
    it('should add and retrieve components', () => {
      entity.addComponent(component);
      const retrieved = entity.getComponent<TestComponent>('test');
      expect(retrieved).toBe(component);
      expect(retrieved?.getValue()).toBe(42);
    });

    it('should check if component exists', () => {
      expect(entity.hasComponent('test')).toBe(false);
      entity.addComponent(component);
      expect(entity.hasComponent('test')).toBe(true);
    });

    it('should remove components', () => {
      entity.addComponent(component);
      expect(entity.hasComponent('test')).toBe(true);
      entity.removeComponent('test');
      expect(entity.hasComponent('test')).toBe(false);
    });

    it('should get all components', () => {
      const component2 = new TestComponent(24);
      entity.addComponent(component);
      entity.addComponent(component2);
      const allComponents = entity.getAllComponents();
      expect(allComponents).toHaveLength(1); // Should be 1 since they have the same type
      expect(allComponents[0]).toBe(component2); // Last added component should be present
    });
  });
});

describe('Component', () => {
  let component: TestComponent;

  beforeEach(() => {
    component = new TestComponent(42);
  });

  it('should serialize and deserialize component data', () => {
    const serialized = component.serialize();
    const newComponent = new TestComponent();
    newComponent.deserialize(serialized);
    expect(newComponent.getValue()).toBe(42);
  });

  it('should return correct component type', () => {
    expect(component.getType()).toBe('test');
  });
}); 