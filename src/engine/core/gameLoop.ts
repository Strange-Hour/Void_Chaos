import { Time } from './time';
import { World } from '../ecs/World';

export type GameLoopCallback = (deltaTime: number) => void;

export class GameLoop {
  private static instance: GameLoop;
  private time: Time;
  private world: World | null = null;
  private isRunning: boolean = false;
  private animationFrameId: number = 0;
  private accumulatedTime: number = 0;
  private readonly fixedTimeStep: number = 1 / 60; // 60 Hz fixed update rate

  private updateCallbacks: GameLoopCallback[] = [];
  private renderCallbacks: GameLoopCallback[] = [];

  private constructor() {
    this.time = Time.getInstance();
    this.gameLoop = this.gameLoop.bind(this);
  }

  public static getInstance(): GameLoop {
    if (!GameLoop.instance) {
      GameLoop.instance = new GameLoop();
    }
    return GameLoop.instance;
  }

  public setWorld(world: World): void {
    this.world = world;
  }

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop(performance.now());
    }
  }

  public stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public addUpdateCallback(callback: GameLoopCallback): void {
    this.updateCallbacks.push(callback);
  }

  public addRenderCallback(callback: GameLoopCallback): void {
    this.renderCallbacks.push(callback);
  }

  public removeUpdateCallback(callback: GameLoopCallback): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  public removeRenderCallback(callback: GameLoopCallback): void {
    const index = this.renderCallbacks.indexOf(callback);
    if (index !== -1) {
      this.renderCallbacks.splice(index, 1);
    }
  }

  private gameLoop(currentTime: number): void {
    this.time.update(currentTime);
    const deltaTime = this.time.getDeltaTime();

    // Accumulate time for fixed updates
    this.accumulatedTime += deltaTime;

    // Run fixed updates (physics, etc)
    while (this.accumulatedTime >= this.fixedTimeStep) {
      // Update ECS World with fixed timestep
      if (this.world) {
        this.world.fixedUpdate(this.fixedTimeStep);
      }
      this.accumulatedTime -= this.fixedTimeStep;
    }

    // Update phase
    for (const callback of this.updateCallbacks) {
      callback(deltaTime);
    }

    // Update ECS World with variable timestep
    if (this.world) {
      this.world.update(deltaTime);
    }

    // Render phase
    for (const callback of this.renderCallbacks) {
      callback(deltaTime);
    }

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }
} 