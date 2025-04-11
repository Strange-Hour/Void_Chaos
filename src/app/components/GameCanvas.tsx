"use client";

import { useEffect, useRef } from "react";
import { Game } from "@engine/Game";
import {
  WaveSpawnSystem,
  WaveConfig,
  SpawnPoint,
} from "@engine/ecs/systems/WaveSpawnSystem";
import { Entity } from "@engine/ecs/Entity";
import { Transform } from "@engine/ecs/components/Transform";
import { EnemyType } from "@engine/ecs/components/Enemy";
import { World } from "@engine/ecs/World";
import { RenderSystem } from "@engine/ecs/systems/RenderSystem";
import { Renderer } from "@engine/ecs/components/Renderer";
import { Sprite } from "@engine/Sprite";
import { EnemyFactory } from "@engine/ecs/factories/EnemyFactory";
import { Player } from "@engine/ecs/components/Player";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create container for the canvas
    const containerId = "game-canvas-container";
    containerRef.current.id = containerId;

    // Create world instance
    const world = new World();

    // Initialize game
    const game = new Game({
      width: 800,
      height: 600,
      containerId,
      backgroundColor: "#1a1a1a",
      fixedTimeStep: 1000 / 60, // 60 FPS physics
    });

    // Create sprites
    const playerSprite = new Sprite({
      url: "/sprites/player.png",
      width: 32,
      height: 32,
    });

    // Create and set enemy sprites
    EnemyFactory.setEnemySprite(
      EnemyType.Basic,
      new Sprite({
        url: "/sprites/enemy-basic.png",
        width: 32,
        height: 32,
      })
    );

    EnemyFactory.setEnemySprite(
      EnemyType.Flanker,
      new Sprite({
        url: "/sprites/enemy-flanker.png",
        width: 32,
        height: 32,
      })
    );

    EnemyFactory.setEnemySprite(
      EnemyType.Ranged,
      new Sprite({
        url: "/sprites/enemy-ranged.png",
        width: 32,
        height: 32,
      })
    );

    // Create player entity
    const player = new Entity();
    const playerTransform = new Transform();
    playerTransform.setPosition({ x: 400, y: 300 }); // Center of the screen
    player.addComponent(playerTransform);
    player.addComponent(new Renderer(playerSprite));
    player.addComponent(new Player());
    world.addEntity(player);

    // Configure wave spawn system
    const waveConfig: WaveConfig[] = [
      {
        enemies: [
          { type: EnemyType.Basic, count: 3 },
          { type: EnemyType.Ranged, count: 1 },
        ],
        spawnDelay: 2000,
        waveDelay: 5000,
        difficultyMultiplier: 1.0,
      },
      {
        enemies: [
          { type: EnemyType.Flanker, count: 2 },
          { type: EnemyType.Basic, count: 2 },
          { type: EnemyType.Ranged, count: 1 },
        ],
        spawnDelay: 1500,
        waveDelay: 5000,
        difficultyMultiplier: 1.2,
      },
      {
        enemies: [
          { type: EnemyType.Basic, count: 4 },
          { type: EnemyType.Flanker, count: 2 },
          { type: EnemyType.Ranged, count: 2 },
        ],
        spawnDelay: 1200,
        waveDelay: 5000,
        difficultyMultiplier: 1.5,
      },
    ];

    // Define spawn points around the edges of the screen
    const spawnPoints: SpawnPoint[] = [
      { position: { x: 50, y: 50 }, weight: 1 }, // Top-left
      { position: { x: 750, y: 50 }, weight: 1 }, // Top-right
      { position: { x: 50, y: 550 }, weight: 1 }, // Bottom-left
      { position: { x: 750, y: 550 }, weight: 1 }, // Bottom-right
      { position: { x: 400, y: 50 }, weight: 1.5 }, // Top-middle (higher weight)
      { position: { x: 400, y: 550 }, weight: 1.5 }, // Bottom-middle (higher weight)
      { position: { x: 50, y: 300 }, weight: 1 }, // Left-middle
      { position: { x: 750, y: 300 }, weight: 1 }, // Right-middle
    ];

    // Create and configure wave spawn system with difficulty settings
    const waveSpawnSystem = new WaveSpawnSystem(world);
    waveSpawnSystem.configure(waveConfig, spawnPoints, {
      baseHealth: 1,
      baseDamage: 1,
      baseSpeed: 1,
      waveScaling: 0.15, // 15% increase per wave
      playerScaling: 0.25, // 25% increase per additional player
    });

    // Set spawn pattern (can be 'random', 'sequential', or 'synchronized')
    waveSpawnSystem.setSpawnPattern("sequential");

    world.addSystem(waveSpawnSystem);

    // Create and add render system
    const renderSystem = new RenderSystem(game.getCanvas());
    world.addSystem(renderSystem);

    // Start the wave system
    waveSpawnSystem.startNextWave();

    // Start the game loop
    game.start();

    // Update world in game loop
    let lastTime = performance.now();
    const updateWorld = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      world.update(deltaTime);
      requestAnimationFrame(updateWorld);
    };
    updateWorld();

    // Cleanup on unmount
    return () => {
      game.destroy();
      world.clear();
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
