import { Camera, CameraConfig } from './Camera';

describe('Camera', () => {
  let camera: Camera;
  const defaultConfig: CameraConfig = {
    width: 800,
    height: 600
  };

  beforeEach(() => {
    camera = new Camera(defaultConfig);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const viewport = camera.getViewport();
      expect(viewport).toEqual({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        zoom: 1
      });
    });

    it('should initialize with custom values', () => {
      const customConfig: CameraConfig = {
        x: 100,
        y: 200,
        width: 1024,
        height: 768,
        zoom: 2,
        minX: 0,
        minY: 0,
        maxX: 2000,
        maxY: 2000
      };
      camera = new Camera(customConfig);
      const viewport = camera.getViewport();
      expect(viewport).toEqual({
        x: 100,
        y: 200,
        width: 1024,
        height: 768,
        zoom: 2
      });
    });
  });

  describe('movement and bounds', () => {
    it('should move by delta', () => {
      camera.move(100, 50);
      const viewport = camera.getViewport();
      expect(viewport.x).toBe(100);
      expect(viewport.y).toBe(50);
    });

    it('should respect bounds', () => {
      camera.setBounds(0, 0, 1000, 1000);
      camera.setPosition(-100, -100);
      let viewport = camera.getViewport();
      expect(viewport.x).toBe(0);
      expect(viewport.y).toBe(0);

      camera.setPosition(500, 500);
      viewport = camera.getViewport();
      expect(viewport.x).toBe(200); // 1000 - 800 = 200 (max possible x)
      expect(viewport.y).toBe(400); // 1000 - 600 = 400 (max possible y)
    });
  });

  describe('zoom', () => {
    it('should set zoom level', () => {
      camera.setZoom(2);
      expect(camera.getViewport().zoom).toBe(2);
    });

    it('should prevent negative or zero zoom', () => {
      camera.setZoom(-1);
      expect(camera.getViewport().zoom).toBe(0.1);

      camera.setZoom(0);
      expect(camera.getViewport().zoom).toBe(0.1);
    });
  });

  describe('coordinate transformations', () => {
    it('should convert world to screen coordinates', () => {
      camera.setPosition(100, 100);
      camera.setZoom(2);

      const screen = camera.worldToScreen(200, 200);
      expect(screen).toEqual({
        x: 200, // (200 - 100) * 2
        y: 200  // (200 - 100) * 2
      });
    });

    it('should convert screen to world coordinates', () => {
      camera.setPosition(100, 100);
      camera.setZoom(2);

      const world = camera.screenToWorld(200, 200);
      expect(world).toEqual({
        x: 200, // 200 / 2 + 100
        y: 200  // 200 / 2 + 100
      });
    });
  });

  describe('visibility checks', () => {
    beforeEach(() => {
      camera.setPosition(0, 0);
      camera.setZoom(1);
    });

    it('should check if point is visible', () => {
      expect(camera.isPointVisible(400, 300)).toBe(true);
      expect(camera.isPointVisible(-100, -100)).toBe(false);
      expect(camera.isPointVisible(900, 700)).toBe(false);
    });

    it('should check if rectangle is visible', () => {
      expect(camera.isRectVisible(0, 0, 400, 300)).toBe(true);
      expect(camera.isRectVisible(-200, -200, 100, 100)).toBe(false);
      expect(camera.isRectVisible(900, 700, 100, 100)).toBe(false);
      expect(camera.isRectVisible(700, 500, 200, 200)).toBe(true);
    });

    it('should account for zoom in visibility checks', () => {
      camera.setZoom(2);
      expect(camera.isPointVisible(200, 150)).toBe(true);
      expect(camera.isPointVisible(500, 400)).toBe(false);
    });
  });
}); 