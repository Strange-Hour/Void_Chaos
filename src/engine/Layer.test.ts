import { Layer } from './Layer';
import { LayerName } from '@/config';

describe('Layer', () => {
  const width = 800;
  const height = 600;
  const scale = 1;

  it('should create a layer with the specified configuration', () => {
    const layer = new Layer({
      name: LayerName.Game,
      zIndex: 1,
      isVisible: true
    });

    expect(layer.getName()).toBe(LayerName.Game);
    expect(layer.getZIndex()).toBe(1);
    expect(layer.isLayerVisible()).toBe(true);
  });

  it('should set canvas dimensions correctly', () => {
    const layer = new Layer({
      name: LayerName.Game,
      zIndex: 1
    });

    layer.setDimensions(width, height, scale);

    const canvas = layer.getCanvas();
    expect(canvas.width).toBe(width * scale);
    expect(canvas.height).toBe(height * scale);
    expect(canvas.style.width).toBe(`${width}px`);
    expect(canvas.style.height).toBe(`${height}px`);
  });

  it('should handle visibility changes', () => {
    const layer = new Layer({
      name: LayerName.Game,
      zIndex: 1,
      isVisible: true
    });

    expect(layer.isLayerVisible()).toBe(true);
    expect(layer.getCanvas().style.display).toBe('block');

    layer.setVisible(false);
    expect(layer.isLayerVisible()).toBe(false);
    expect(layer.getCanvas().style.display).toBe('none');
  });

  it('should update z-index correctly', () => {
    const layer = new Layer({
      name: LayerName.Game,
      zIndex: 1
    });

    expect(layer.getZIndex()).toBe(1);
    expect(layer.getCanvas().style.zIndex).toBe('1');

    layer.setZIndex(2);
    expect(layer.getZIndex()).toBe(2);
    expect(layer.getCanvas().style.zIndex).toBe('2');
  });

  it('should create a valid 2D context', () => {
    const layer = new Layer({
      name: LayerName.Game,
      zIndex: 1
    });

    const context = layer.getContext();
    expect(context).toBeDefined();
    expect(context.canvas).toBe(layer.getCanvas());
  });

  it('should clear the canvas correctly', () => {
    const layer = new Layer({
      name: LayerName.Game,
      zIndex: 1
    });

    layer.setDimensions(width, height, scale);

    const context = layer.getContext();
    const clearRectSpy = jest.spyOn(context, 'clearRect');

    layer.clear();
    expect(clearRectSpy).toHaveBeenCalledWith(0, 0, width * scale, height * scale);
  });
}); 