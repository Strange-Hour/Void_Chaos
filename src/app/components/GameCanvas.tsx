"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@engine/Canvas";
import { Sprite } from "@engine/Sprite";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create container for the canvas
    const containerId = "game-canvas-container";
    containerRef.current.id = containerId;

    // Initialize canvas
    const canvas = new Canvas({
      width: 800,
      height: 600,
      containerId,
      backgroundColor: "#1a1a1a",
    });

    // Create layers
    const backgroundLayer = canvas.getLayer("background");
    const gameLayer = canvas.createLayer("game", { zIndex: 1 });
    const uiLayer = canvas.createLayer("ui", { zIndex: 2 });

    if (backgroundLayer && gameLayer && uiLayer) {
      // Draw something on each layer to test
      const bgCtx = backgroundLayer.getContext();
      bgCtx.fillStyle = "#2a2a2a";
      bgCtx.fillRect(100, 100, 200, 200);

      const gameCtx = gameLayer.getContext();
      gameCtx.fillStyle = "#4a4a4a";
      gameCtx.fillRect(150, 150, 200, 200);

      const uiCtx = uiLayer.getContext();
      uiCtx.fillStyle = "#ffffff";
      uiCtx.font = "20px Arial";
      uiCtx.fillText("Layer System Test", 300, 50);

      // Test sprite system with a simple shape since we don't have actual sprites yet
      const testSprite = new Sprite({
        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADsQAAA7EB9YPtSQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAL8SURBVGiB7ZnPaxNBFMe/m7RNm7RJ1WiwLYr0JB4UPIhePHhRUDyJeBBE8CL+AYJ48K4HEbwqghdBTyJ48SB48CKIiCAIgvgDRG0EwbY2TZqkSZN9HjYJu5vZ3dnNTBJkPrDs7Mx7O9+dN+/NbAhVVeF0kGX5JoBpAEcB9AM4BGA/gN0A/AACAPwAhgEQFr8dAL4C+AYgAmATwEf+9wPAewBvSZJ8a+VTaQXAGIALAE4DOA5gH4DdALoAqKZW9aMKIAngN4BVAC8BvALwHMBKMwCMAXgM4JiNDjQTqwCuEgTxrBkA7gC4Z9OxVuI+gBsEQfxuBMBVAA9tOtNOPARwmSCIRD0AkwBe23SiE/EGwAmCIL7XAjAA4COAAzad6FSsAxgjCGKbv0g5vXEX/w9xAMBdowv8DJy06UAn4xR/gQ9gxKYDnYwR/gIfgMemA50Mj/ECH8AumwCiAKIW7QgAhwEMWbRbBhA3XlJVtRvAL5sA/gD4CWAZQA+AEQBD6PxNtQzgGEEQv7lBLAF4ZtOBTsZT/oIZgHEAb2060Ml4QxDEOH+hNpHtZKgALhktmgF4CWAD1k6onYgNgiBeGS2aARBJAM9tOtOJeA7gTq1FM3WiOQAXbTrVSVgAcI4giGStRTMAEYIg3gGYArBk07F2xxKAKSPxPADDYU4QxCcAkwDu23SwXXEfwGQteZ54w0FOEMRvAOcBXAKwatPZVmMVrZFnCcBwmBMEkQZwC8AhAGcBPAHwxaYARyMO4DWAGwCOEATxoJ5wXvQD6AVwHq0Z5naxBeA2gKsEQWwbCRBCQJblKQAzACbQnmG+CGAW7JWpYbQKIcSQZXkQwDSYYX4EQD+APgBBML8kGQQzSfnBvBUKg3mPtA3mt3wRzHukRQDzYN4jvQPzHum9LMvvxOxb+R9YCCEERVG9FEWNUBQ1TFHUAEVR+ymK6qEoKkhRlJ+iKB9FUWGKonoNbeMURW1SFBWjKGqDoqgViqI+UBT1iqKoBYqiXlAU9YyiqMcURc1RFPWA+gfVtE6zhRZaUQAAAABJRU5ErkJggg==",
        width: 48,
        height: 48,
      });

      // Draw the test sprite when it's loaded
      const drawSprite = () => {
        if (testSprite.isReady()) {
          testSprite.draw(gameCtx, 400, 300, {
            rotation: 45,
            alpha: 0.8,
          });
        } else {
          requestAnimationFrame(drawSprite);
        }
      };
      drawSprite();
    }

    // Cleanup on unmount
    return () => {
      canvas.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid='game-canvas-container'
      style={{
        width: "800px",
        height: "600px",
        margin: "0 auto",
        border: "1px solid #333",
      }}
    />
  );
}
