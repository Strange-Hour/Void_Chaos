"use client";

import { useEffect, useRef } from "react";
import { Game } from "@engine/Game";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create container for the canvas
    const containerId = "game-canvas-container";
    containerRef.current.id = containerId;

    // Initialize game
    const game = new Game({
      width: 800,
      height: 600,
      containerId,
      backgroundColor: "#1a1a1a",
      fixedTimeStep: 1000 / 60, // 60 FPS physics
    });

    // Start the game loop
    game.start();

    // Cleanup on unmount
    return () => {
      game.destroy();
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
