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
import { CharacterControllerSystem } from "@engine/ecs/systems/CharacterControllerSystem";
import { DebugSystem } from "@engine/ecs/systems/DebugSystem";
import { AIBehaviorSystem } from "@engine/ecs/systems/AIBehaviorSystem";
import { WaveSpawnSystem } from "@engine/ecs/systems/WaveSpawnSystem";
import { WorldSystem } from "@engine/ecs/systems/WorldSystem";
import { SpriteManager } from "@engine/SpriteManager";
import { Sprite } from "@engine/Sprite";
import { createPlayer } from '@engine/ecs/factories/PlayerFactory';

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
      game: Game | null; 
      world: World | null;
      isInitializing: boolean;  // Add initialization lock
      instanceId: number | null;  // Track which instance is initializing
    };
  }
}

export default function GameWrapper({ dimensions, containerId }: GameWrapperProps) {
  const [debug, setDebug] = useState(false);
  const [playerStats, setPlayerStats] = useState("HP: 100");
  const [entityCount, setEntityCount] = useState(0);
  const [fps, setFps] = useState(0);
  const isInitialized = useRef(false);

  useEffect(() => {
    const instanceId = Date.now(); // Unique ID for this effect run
    console.log(`[${instanceId}] GameWrapper useEffect START`);

    // Initialize the global state if it doesn't exist
    if (!window.globalGameInstance) {
      window.globalGameInstance = {
        game: null,
        world: null,
        isInitializing: false,
        instanceId: null
      };
    }

    // If game is already running, just link to it
    if (window.globalGameInstance.game && !window.globalGameInstance.isInitializing) {
      console.log(`[${instanceId}] Game already initialized and running, linking to existing instance`);
      if (!isInitialized.current) {
        if (window.globalGameInstance.world) {
          setEntityCount(window.globalGameInstance.world.getEntities().length);
        }
        isInitialized.current = true;
      }
      return;
    }

    // If another instance is currently initializing, back off
    if (window.globalGameInstance.isInitializing && window.globalGameInstance.instanceId !== instanceId) {
      console.log(`[${instanceId}] Another instance (${window.globalGameInstance.instanceId}) is initializing, backing off`);
      return;
    }

    // If we're already initialized, don't do it again
    if (isInitialized.current) {
      console.log(`[${instanceId}] This component instance is already initialized, skipping`);
      return;
    }

    // Set initialization lock
    console.log(`[${instanceId}] Taking initialization lock`);
    window.globalGameInstance.isInitializing = true;
    window.globalGameInstance.instanceId = instanceId;
    isInitialized.current = true;

    // Create world instance
    console.log(`[${instanceId}] Creating new World instance`);
    const world = new World();
    window.globalGameInstance.world = world;

    // Initialize game with dynamic dimensions
    console.log(`[${instanceId}] Creating new Game instance`);
    const game = new Game({
      width: dimensions.width,
      height: dimensions.height,
      containerId,
      backgroundColor: "#1a1a1a",
      fixedTimeStep: 1000 / 60,
      targetFPS: 60,
    });

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
        if (window.globalGameInstance?.game) { // Check window instance
          window.globalGameInstance.game.forceRedraw();
        }
      }
    };

    window.addEventListener("keydown", keyListener);

    // Set up an interval to force redraw regularly to ensure debug lines are updated
    const redrawInterval = setInterval(() => {
      if (window.globalGameInstance?.game && debug) { // Check window instance
        const game = window.globalGameInstance.game;
        const world = window.globalGameInstance.world;
        const lastRedrawTime = (window as any)._lastGameRedrawTime || 0;
        const currentTime = Date.now();

        if (currentTime - lastRedrawTime > 500) {
          game.forceRedraw();
          (window as any)._lastGameRedrawTime = currentTime;

          if (world) {
            setEntityCount(world.getEntities().length);
            setFps(60); // Note: This might not be accurate, consider getting actual FPS

            const players = world.getEntities().filter((entity: Entity) => entity.hasComponent("player"));
            if (players.length > 0) {
              const player = players[0];
              if (player.hasComponent("health")) {
                const health = player.getComponent("health") as Health;
                setPlayerStats(`HP: ${health.getCurrentHealth()}/${health.getMaxHealth()}`);
              }
            }
          }
        }
      }
    }, 2000);

    // Initialize game systems and start
    SpriteManager.preloadEssentialSprites()
      .then(async () => {
        console.log(`[${instanceId}] SpriteManager.then() START`);
        
        // Only proceed if we still hold the initialization lock
        if (window.globalGameInstance?.instanceId !== instanceId) {
          console.log(`[${instanceId}] Lost initialization lock, aborting setup`);
          return;
        }

        // Set the game instance only after we're sure we're going to complete initialization
        window.globalGameInstance.game = game;

        // Create and initialize all game systems
        const inputSystem = new InputSystem(inputManager);
        const renderSystem = new RenderSystem(game.getCanvas());
        const characterSystem = new CharacterControllerSystem(inputManager);
        const debugSystem = new DebugSystem(game.getCanvas(), inputManager);
        const aiBehaviorSystem = new AIBehaviorSystem();
        const waveSpawnSystem = new WaveSpawnSystem(world);
        const collisionSystem = game.initializeCollisionSystem();

        // Configure collision system
        collisionSystem.setDebug(true);
        collisionSystem.setResolutionStrength(0.7);
        collisionSystem.setLayerCollision(1, 1, true);
        collisionSystem.setLayerCollision(1, 2, true);
        collisionSystem.setLayerCollision(2, 2, false);

        // Set world bounds for collision system
        const worldPadding = Math.min(dimensions.width, dimensions.height) * 0.025; // 2.5% padding
        collisionSystem.setWorldBounds(dimensions.width, dimensions.height, worldPadding);

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

        // Create and add WorldSystem
        const worldSystem = new WorldSystem(world);
        game.addSystem(worldSystem);

        // Configure wave spawning
        const boundary = {
          width: dimensions.width,
          height: dimensions.height,
          padding: Math.min(dimensions.width, dimensions.height) * 0.05,
        };

        const waveConfig = [
          {
            enemies: [
              { typeId: 'basic', count: 5 },
              { typeId: 'flanker', count: 2 },
            ],
            spawnDelay: 2000,
            waveDelay: 5000,
          },
          {
            enemies: [
              { typeId: 'basic', count: 8 },
              { typeId: 'flanker', count: 3 },
              { typeId: 'ranged', count: 2 },
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
        const existingPlayers = world.getEntities().filter(entity => entity.hasComponent('player'));
        console.log(`[${instanceId}] Checking for existing players: ${existingPlayers.length}`);
        if (existingPlayers.length === 0) {
          console.log(`[${instanceId}] Creating player...`);
          const player = createPlayer(playerSprite, dimensions.width, dimensions.height);
          console.log(`[${instanceId}] Adding player (ID: ${player.getId()}) to world...`);
          world.addEntity(player);
          console.log(`[${instanceId}] Player added to world`);
        } else {
          console.log(`[${instanceId}] Player already exists, skipping creation`);
        }

        // Start the game
        waveSpawnSystem.startNextWave();
        console.log(`[${instanceId}] Starting game loop...`);
        game.start();

        // After everything is set up, release the initialization lock
        console.log(`[${instanceId}] Setup complete, releasing initialization lock`);
        window.globalGameInstance.isInitializing = false;
        window.globalGameInstance.instanceId = null;
      })
      .catch((error) => {
        console.error(`[${instanceId}] Failed to initialize game:`, error);
        // Clean up on error
        if (window.globalGameInstance?.instanceId === instanceId) {
          window.globalGameInstance.isInitializing = false;
          window.globalGameInstance.instanceId = null;
          window.globalGameInstance.game = null;
          window.globalGameInstance.world = null;
        }
        isInitialized.current = false;
      });

    // Cleanup function
    return () => {
      console.log(`[${instanceId}] GameWrapper useEffect cleanup`);
      
      // Only cleanup if we own the current instance
      if (window.globalGameInstance?.instanceId === instanceId) {
        console.log(`[${instanceId}] We own the instance, cleaning up`);
        window.globalGameInstance.isInitializing = false;
        window.globalGameInstance.instanceId = null;
        
        if (window.globalGameInstance.game) {
          console.log(`[${instanceId}] Stopping game loop...`);
          window.globalGameInstance.game.stop();
          window.globalGameInstance.game = null;
          window.globalGameInstance.world = null;
        }
      }

      // Always clean up our own listeners
      window.removeEventListener("keydown", keyListener);
      clearInterval(redrawInterval);
      isInitialized.current = false;
    };
  }, [dimensions, containerId]);

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