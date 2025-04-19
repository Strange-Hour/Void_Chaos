export class Time {
  private static instance: Time;
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private readonly fpsUpdateInterval: number = 1000; // Update FPS every second

  private constructor() { }

  public static getInstance(): Time {
    if (!Time.instance) {
      Time.instance = new Time();
    }
    return Time.instance;
  }

  public update(currentTime: number): void {
    // Convert to seconds for easier physics calculations
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime));
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
  }

  public getDeltaTime(): number {
    return this.deltaTime;
  }

  public getFPS(): number {
    return this.fps;
  }

  public getTime(): number {
    return this.lastTime;
  }
} 