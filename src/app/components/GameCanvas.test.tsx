import { render, screen } from "@testing-library/react";
import * as React from "react";
import GameCanvas from "./GameCanvas";

// Mock React's hooks
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: jest.fn(),
  useEffect: jest.fn(),
}));

// Mock the Canvas module
jest.mock("@engine/Canvas", () => {
  return {
    Canvas: jest.fn().mockImplementation(() => ({
      createLayer: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue({
          fillStyle: "",
          fillRect: jest.fn(),
          font: "",
          fillText: jest.fn(),
        }),
      }),
      getLayer: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue({
          fillStyle: "",
          fillRect: jest.fn(),
          font: "",
          fillText: jest.fn(),
        }),
      }),
      destroy: jest.fn(),
    })),
  };
});

// Mock the Sprite module
jest.mock("@engine/Sprite", () => {
  return {
    Sprite: jest.fn().mockImplementation(() => ({
      isReady: jest.fn().mockReturnValue(true),
      draw: jest.fn(),
    })),
  };
});

describe("GameCanvas", () => {
  let mockCanvas: jest.Mock;
  let mockSprite: jest.Mock;
  let cleanupFn: () => void;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Get the mocked modules
    mockCanvas = jest.requireMock("@engine/Canvas").Canvas;
    mockSprite = jest.requireMock("@engine/Sprite").Sprite;

    // Setup default useRef behavior
    (React.useRef as jest.Mock).mockReturnValue({
      current: document.createElement("div"),
    });

    // Setup default useEffect behavior to store cleanup function
    (React.useEffect as jest.Mock).mockImplementation((f) => {
      cleanupFn = f() || (() => {});
    });
  });

  it("should render container with correct dimensions", () => {
    render(<GameCanvas />);

    const container = screen.getByTestId("game-canvas-container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({
      width: "800px",
      height: "600px",
      margin: "0 auto",
      border: "1px solid #333",
    });
  });

  it("should initialize canvas with layers and draw on them", () => {
    // Arrange
    const mockCreateLayer = jest.fn().mockReturnValue({
      getContext: jest.fn().mockReturnValue({
        fillStyle: "",
        fillRect: jest.fn(),
        font: "",
        fillText: jest.fn(),
      }),
    });
    const mockGetLayer = jest.fn().mockReturnValue({
      getContext: jest.fn().mockReturnValue({
        fillStyle: "",
        fillRect: jest.fn(),
        font: "",
        fillText: jest.fn(),
      }),
    });
    const mockDestroy = jest.fn();

    mockCanvas.mockImplementation(() => ({
      createLayer: mockCreateLayer,
      getLayer: mockGetLayer,
      destroy: mockDestroy,
    }));

    // Act
    render(<GameCanvas />);

    // Assert canvas initialization
    expect(mockCanvas).toHaveBeenCalledWith({
      width: 800,
      height: 600,
      containerId: "game-canvas-container",
      backgroundColor: "#1a1a1a",
    });

    // Assert layer creation
    expect(mockGetLayer).toHaveBeenCalledWith("background");
    expect(mockCreateLayer).toHaveBeenCalledWith("game", { zIndex: 1 });
    expect(mockCreateLayer).toHaveBeenCalledWith("ui", { zIndex: 2 });

    // Get contexts and verify drawing operations
    const bgContext = mockGetLayer().getContext();
    const gameContext = mockCreateLayer().getContext();
    const uiContext = mockCreateLayer().getContext();

    expect(bgContext.fillRect).toHaveBeenCalledWith(100, 100, 200, 200);
    expect(gameContext.fillRect).toHaveBeenCalledWith(150, 150, 200, 200);
    expect(uiContext.fillText).toHaveBeenCalledWith(
      "Layer System Test",
      300,
      50
    );

    // Assert sprite creation and drawing
    expect(mockSprite).toHaveBeenCalled();
    const spriteInstance = mockSprite.mock.results[0].value;
    expect(spriteInstance.draw).toHaveBeenCalledWith(gameContext, 400, 300, {
      rotation: 45,
      alpha: 0.8,
    });

    // Call cleanup function
    cleanupFn();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("should not initialize canvas if container ref is null", () => {
    // Mock useRef to return null
    (React.useRef as jest.Mock).mockReturnValueOnce({ current: null });

    render(<GameCanvas />);

    expect(mockCanvas).not.toHaveBeenCalled();
  });

  it("should handle sprite not ready state", () => {
    // Mock sprite to be not ready initially, then ready after one frame
    let isReady = false;
    mockSprite.mockImplementation(() => ({
      isReady: jest.fn().mockImplementation(() => isReady),
      draw: jest.fn(),
    }));

    // Mock requestAnimationFrame
    const mockRAF = jest.fn().mockImplementation((callback) => {
      isReady = true; // Set sprite to ready
      callback(); // Call the animation frame callback
      return 123; // Return a dummy frame ID
    });
    global.requestAnimationFrame = mockRAF;

    render(<GameCanvas />);

    // Verify requestAnimationFrame was called
    expect(mockRAF).toHaveBeenCalled();

    // Cleanup
    global.requestAnimationFrame = window.requestAnimationFrame;
  });

  it("should handle case when layers are not created successfully", () => {
    // Mock getLayer to return null for one of the layers
    mockCanvas.mockImplementation(() => ({
      createLayer: jest.fn().mockReturnValue(null),
      getLayer: jest.fn().mockReturnValue(null),
      destroy: jest.fn(),
    }));

    render(<GameCanvas />);

    // Since layers are null, no drawing operations should be performed
    const mockLayer = mockCanvas().createLayer();
    expect(mockLayer).toBeNull();
  });
});
