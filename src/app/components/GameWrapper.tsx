"use client";

import { useEffect, useState, useRef } from "react";
import { Game } from "@engine/Game";
import { World } from "@engine/ecs/World";
import { Entity } from "@engine/ecs/Entity";
import { Health } from "@engine/ecs/components/Health";
import { InputManager } from "@engine/input/InputManager";
import { KeyboardInputProvider } from "@engine/input/KeyboardInputProvider";
import { InputSystem } from "@engine/ecs/systems/InputSystem";
import { RenderSystem } from "@engine/ecs/systems/RenderSystem";
import { CharacterControllerSystem } from "@/engine/ecs/systems/CharacterControllerSystem";
import { DebugSystem } from "@engine/ecs/systems/DebugSystem";
import { AIBehaviorSystem } from "@engine/ecs/systems/AIBehaviorSystem";
import { WaveSpawnSystem } from "@engine/ecs/systems/WaveSpawnSystem";
import { SpriteManager } from "@engine/SpriteManager";
import { Sprite } from "@engine/Sprite";
import { createPlayer } from "@engine/ecs/factories/PlayerFactory";
import { GameLoop } from "@engine/core/gameLoop";

interface GameWrapperProps {
  dimensions: {
    width: number;
    height: number;
  };
  containerId: string;
}

// Use window object for a truly global reference that survives HMR
declare global {
  interface Window {
    globalGameInstance?: {
      gameLoop: GameLoop | null;
      game: Game | null;
      world: World | null;
      isInitializing: boolean;
      instanceId: number | null;
    };
  }
}

export default function GameWrapper({
  dimensions,
  containerId,
}: GameWrapperProps) {
  const [debug, setDebug] = useState(false);
  const [playerStats, setPlayerStats] = useState("HP: 100");
  const [entityCount, setEntityCount] = useState(0);
  const [fps, setFps] = useState(0);
  const isInitialized = useRef(false);

  useEffect(() => {
    const instanceId = Date.now();

    // Initialize the global state if it doesn't exist
    if (!window.globalGameInstance) {
      window.globalGameInstance = {
        gameLoop: null,
        game: null,
        world: null,
        isInitializing: false,
        instanceId: null,
      };
    }

    // If game is already running, just link to it
    if (
      window.globalGameInstance.gameLoop &&
      !window.globalGameInstance.isInitializing
    ) {
      if (!isInitialized.current) {
        if (window.globalGameInstance.world) {
          setEntityCount(window.globalGameInstance.world.getEntities().length);
        }
        isInitialized.current = true;
      }
      return;
    }

    // If another instance is currently initializing, back off
    if (
      window.globalGameInstance.isInitializing &&
      window.globalGameInstance.instanceId !== instanceId
    ) {
      return;
    }

    // If we're already initialized, don't do it again
    if (isInitialized.current) {
      return;
    }

    // Set initialization lock
    window.globalGameInstance.isInitializing = true;
    window.globalGameInstance.instanceId = instanceId;
    isInitialized.current = true;

    // Create world instance
    const world = new World();
    window.globalGameInstance.world = world;

    // Initialize game with dynamic dimensions
    const game = new Game({
      width: dimensions.width,
      height: dimensions.height,
      containerId,
      backgroundColor: "#1a1a1a",
      fixedTimeStep: 1000 / 60,
      targetFPS: 60,
    });

    // Initialize GameLoop
    const gameLoop = GameLoop.getInstance();
    window.globalGameInstance.gameLoop = gameLoop;
    gameLoop.setWorld(world);

    // Create input manager and provider
    const inputManager = new InputManager({
      enableKeyboard: true,
      enableMouse: true,
      bufferConfig: {
        enabled: true,
        duration: 100,
      },
    });
    const keyboardProvider = new KeyboardInputProvider();
    inputManager.registerProvider(keyboardProvider);

    // Add global key event listener to debug F1 presses
    const keyListener = (e: KeyboardEvent): void => {
      if (e.key === "r" || e.key === "R") {
        game.forceRedraw();
      }
    };

    window.addEventListener("keydown", keyListener);

    // Set up an interval to force redraw regularly to ensure debug lines are updated
    const redrawInterval = setInterval(() => {
      if (debug) {
        const lastRedrawTime = (window as any)._lastGameRedrawTime || 0;
        const currentTime = Date.now();

        if (currentTime - lastRedrawTime > 500) {
          game.forceRedraw();
          (window as any)._lastGameRedrawTime = currentTime;

          setEntityCount(world.getEntities().length);
          setFps(60); // Note: This might not be accurate, consider getting actual FPS

          const players = world
            .getEntities()
            .filter((entity: Entity) => entity.hasComponent("player"));
          if (players.length > 0) {
            const player = players[0];
            if (player.hasComponent("health")) {
              const health = player.getComponent("health") as Health;
              setPlayerStats(
                `HP: ${health.getCurrentHealth()}/${health.getMaxHealth()}`
              );
            }
          }
        }
      }
    }, 2000);

    // Initialize game systems and start
    SpriteManager.preloadEssentialSprites()
      .then(async () => {
        // Only proceed if we still hold the initialization lock
        if (window.globalGameInstance?.instanceId !== instanceId) {
          return;
        }

        // Set the game instance only after we're sure we're going to complete initialization
        window.globalGameInstance.game = game;

        // Create and initialize all game systems
        const inputSystem = new InputSystem(inputManager);
        const characterSystem = new CharacterControllerSystem(dimensions);
        const aiBehaviorSystem = new AIBehaviorSystem();
        const renderSystem = new RenderSystem(game.getCanvas());
        const debugSystem = new DebugSystem(game.getCanvas(), inputManager);
        const waveSpawnSystem = new WaveSpawnSystem(world);
        const collisionSystem = game.initializeCollisionSystem();

        // Configure collision system
        collisionSystem.setDebug(true);
        collisionSystem.setResolutionStrength(0.7);
        collisionSystem.setLayerCollision(1, 1, true);
        collisionSystem.setLayerCollision(1, 2, true);
        collisionSystem.setLayerCollision(2, 2, false);

        // Set world bounds for collision system
        const worldPadding =
          Math.min(dimensions.width, dimensions.height) * 0.025;
        collisionSystem.setWorldBounds(
          dimensions.width,
          dimensions.height,
          worldPadding
        );

        // Store debug references
        if (typeof window !== "undefined") {
          (window as any).debugSystem = debugSystem;
          (window as any).collisionSystem = collisionSystem;
          (window as any).gameWorld = world;
        }

        // Add systems to world
        world.addSystem(inputSystem);
        world.addSystem(characterSystem);
        world.addSystem(waveSpawnSystem);
        world.addSystem(aiBehaviorSystem);
        world.addSystem(debugSystem);
        world.addSystem(renderSystem);
        world.addSystem(collisionSystem);

        // Add render callback to GameLoop
        gameLoop.addRenderCallback((_deltaTime) => {
          game.forceRedraw();
        });

        // Configure wave spawning
        const boundary = {
          width: dimensions.width,
          height: dimensions.height,
          padding: Math.min(dimensions.width, dimensions.height) * 0.05,
        };

        const waveConfig = [
          {
            enemies: [
              { typeId: "basic", count: 5 },
              { typeId: "flanker", count: 2 },
            ],
            spawnDelay: 2000,
            waveDelay: 5000,
          },
          {
            enemies: [
              { typeId: "basic", count: 5 },
              { typeId: "bomber", count: 4 },
              { typeId: "flanker", count: 3 },
              { typeId: "ranged", count: 2 },
            ],
            spawnDelay: 1500,
            waveDelay: 5000,
          },
        ];

        waveSpawnSystem.configure(waveConfig, boundary, {
          baseHealth: 1,
          baseDamage: 1,
          baseSpeed: 1,
          waveScaling: 0.1,
          playerScaling: 0.3,
        });

        // Create player and start game
        const playerSprite = new Sprite({
          url: "/sprites/player",
          width: 32,
          height: 32,
        });

        await playerSprite.forceLoad(10000);

        // Check if a player already exists
        const existingPlayers = world
          .getEntities()
          .filter((entity) => entity.hasComponent("player"));

        if (existingPlayers.length === 0) {
          const player = createPlayer(
            playerSprite,
            dimensions.width,
            dimensions.height
          );

          world.addEntity(player);
        }

        // Start the game
        waveSpawnSystem.startNextWave();
        gameLoop.start();

        // After everything is set up, release the initialization lock
        window.globalGameInstance.isInitializing = false;
        window.globalGameInstance.instanceId = null;
      })
      .catch((error) => {
        console.error(`[${instanceId}] Failed to initialize game:`, error);
        // Clean up on error
        if (window.globalGameInstance?.instanceId === instanceId) {
          window.globalGameInstance.isInitializing = false;
          window.globalGameInstance.instanceId = null;
          window.globalGameInstance.gameLoop = null;
          window.globalGameInstance.game = null;
          window.globalGameInstance.world = null;
        }
        isInitialized.current = false;
      });

    // Cleanup function
    return () => {
      // Only cleanup if we own the current instance
      if (window.globalGameInstance?.instanceId === instanceId) {
        window.globalGameInstance.isInitializing = false;
        window.globalGameInstance.instanceId = null;

        if (window.globalGameInstance.gameLoop) {
          window.globalGameInstance.gameLoop.stop();
          window.globalGameInstance.gameLoop = null;
          window.globalGameInstance.game = null;
          window.globalGameInstance.world = null;
        }
      }

      // Always clean up our own listeners
      window.removeEventListener("keydown", keyListener);
      clearInterval(redrawInterval);
      isInitialized.current = false;
    };
  }, [dimensions, containerId, debug]);

  return debug ? (
    <div className='absolute bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 text-sm'>
      <p>Debug: ENABLED (F1 to toggle)</p>
      <p>Player Stats: {playerStats}</p>
      <p>
        Entities: {entityCount} / FPS: {fps}
      </p>
      <p className='text-yellow-400 text-xs mt-2'>
        Open browser console and run{" "}
        <span className='font-mono'>window.checkCollisions()</span> to debug
        collision issues
      </p>
    </div>
  ) : null;
}
