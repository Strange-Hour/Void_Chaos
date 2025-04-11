import '@testing-library/jest-dom';

// Mock window.requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);

// Mock window.cancelAnimationFrame
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === '2d') {
    return {
      scale: jest.fn(),
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      fillStyle: '',
      font: '',
      globalAlpha: 1,
      canvas: this,
      globalCompositeOperation: 'source-over',
      beginPath: jest.fn(),
      clip: jest.fn(),
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
}; 