"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "@engine/Game";
import {
  WaveSpawnSystem,
  WaveConfig,
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
import { AIBehaviorSystem } from "@engine/ecs/systems/AIBehaviorSystem";
import { CharacterControllerSystem } from "@engine/ecs/systems/CharacterControllerSystem";
import { InputManager } from "@engine/input/InputManager";
import { CharacterController } from "@engine/ecs/components/CharacterController";
import { KeyboardInputProvider } from "@engine/input/KeyboardInputProvider";
import { InputAction } from "@engine/input/types";
import { InputSystem } from "@engine/ecs/systems/InputSystem";
import { DebugSystem } from "@engine/ecs/systems/DebugSystem";
import { WorldSystem } from "@engine/ecs/systems/WorldSystem";
import { SpriteManager } from "@engine/SpriteManager";

// This ensures the component is a Client Component in Next.js

// At the top of the file, add this interface
interface CustomWindow extends Window {
  debugSystem?: DebugSystem;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkDebugStatus?: any;
  game?: Game;
  gameWorld?: World;
  _lastGameRedrawTime?: number;
}

// Add a debug helper for checking the game state
function checkDebugStatus() {
  try {
    // Access the debug system from window
    const debugSystem = (window as CustomWindow).debugSystem;
    if (!debugSystem) {
      console.error("Debug system not found on window object");
      return;
    }

    // Use a method we know exists to verify it's the right object
    const requirements = debugSystem.getRequiredComponents();
    console.log("Debug system requirements:", requirements);

    // Try to invoke toggleDebug directly
    console.log("Attempting to toggle debug mode directly...");
    debugSystem.toggleDebug();

    console.log("Debug system seems to be working");
  } catch (error) {
    console.error("Error accessing debug system:", error);
  }
}

// Don't access window at the top level
// (window as CustomWindow).checkDebugStatus = checkDebugStatus;

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [debug, setDebug] = useState(false); // Start with debug mode disabled by default

  useEffect(() => {
    if (!containerRef.current) return;

    // Make the debug function available in the browser console
    // This is now safely inside useEffect which only runs client-side
    if (typeof window !== "undefined") {
      (window as CustomWindow).checkDebugStatus = checkDebugStatus;
    }

    // Create container for the canvas
    const containerId = "game-canvas-container";
    containerRef.current.id = containerId;

    // Create world instance
    const world = new World();

    // Initialize game with fixed timestep
    const game = new Game({
      width: 800,
      height: 600,
      containerId,
      backgroundColor: "#1a1a1a",
      fixedTimeStep: 1000 / 60, // 60 FPS physics
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
    const keyListener = (e: KeyboardEvent) => {
      console.log(`Key pressed: ${e.key} (keyCode: ${e.keyCode})`);

      // Add an R key handler to force a redraw of the game
      if (e.key === "r" || e.key === "R") {
        console.log("Force redraw triggered by keyboard (R key)");
        if (typeof window !== "undefined" && (window as CustomWindow).game) {
          const game = (window as CustomWindow).game;
          // Force redraw
          (game as unknown as { forceRedraw: () => void }).forceRedraw();
        }
      }
    };

    // Only add event listeners in the browser
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", keyListener);
    }

    // Set up an interval to force redraw regularly to ensure debug lines are updated
    const redrawInterval = setInterval(() => {
      if (
        typeof window !== "undefined" &&
        (window as CustomWindow).game &&
        debug // Only force redraw when debug is enabled
      ) {
        const game = (window as CustomWindow).game;
        if (game) {
          // Use a flag to prevent overlapping or excessive redraws
          const customWin = window as CustomWindow;
          const lastRedrawTime = customWin._lastGameRedrawTime || 0;
          const currentTime = Date.now();

          // Only redraw if at least 500ms have passed since the last redraw
          if (currentTime - lastRedrawTime > 500) {
            console.log("Automatic force redraw triggered (interval)");
            (game as unknown as { forceRedraw: () => void }).forceRedraw();
            customWin._lastGameRedrawTime = currentTime;
          }
        }
      }
    }, 2000); // Check less frequently to reduce overhead

    // Create F1 key subscription to toggle debug mode
    const debugSubscriber = {
      onInputActionStart: (action: InputAction) => {
        console.log(`InputAction received: ${action}`);
        if (action === InputAction.Debug) {
          console.log("Debug action received through subscription!");

          // Add code to check the player's movement direction
          if (
            typeof window !== "undefined" &&
            (window as CustomWindow).debugSystem
          ) {
            // Force player to have a move direction for testing
            setTimeout(() => {
              const debugSystem = (window as CustomWindow).debugSystem;
              if (debugSystem) {
                // Call forceDebugDraw with proper type assertion
                (
                  debugSystem as unknown as { forceDebugDraw: () => void }
                ).forceDebugDraw();

                // Log the state of the debug entities
                const isEnabled = (
                  debugSystem as unknown as { isEnabled: boolean }
                ).isEnabled;
                console.log("Debug entities state:", {
                  isEnabled: isEnabled,
                });

                // Make sure React state matches engine state
                setDebug(isEnabled);
              }
            }, 100); // Small delay to ensure player is registered
          }

          setDebug((prev) => {
            const newDebugState = !prev;
            console.log(
              `React debug mode ${newDebugState ? "enabled" : "disabled"}`
            );

            // Synchronize the engine's debug system with React state
            if (
              typeof window !== "undefined" &&
              (window as CustomWindow).debugSystem
            ) {
              const debugSystem = (window as CustomWindow).debugSystem;
              if (debugSystem) {
                // Check current engine debug state
                const currentState = (
                  debugSystem as unknown as { isEnabled: boolean }
                ).isEnabled;

                // Only toggle if states are out of sync
                if (currentState !== newDebugState) {
                  console.log(
                    "Synchronizing DebugSystem state with React state"
                  );
                  debugSystem.toggleDebug();
                }
              }
            }

            return newDebugState;
          });
        }
      },
    };

    // Subscribe to input events
    inputManager.subscribe(debugSubscriber);

    // Log the current debug state for verification
    console.log("Initial debug state:", debug);

    // Preload essential sprites before creating game entities
    SpriteManager.preloadEssentialSprites()
      .then(() => {
        // Create sprites with preloaded assets
        const playerSprite = new Sprite({
          url: "/sprites/player",
          width: 32,
          height: 32,
        });

        // Set enemy sprites
        const basicEnemySprite = new Sprite({
          url: "/sprites/enemy-basic",
          width: 32,
          height: 32,
        });

        const flankerEnemySprite = new Sprite({
          url: "/sprites/enemy-flanker",
          width: 32,
          height: 32,
        });

        const rangedEnemySprite = new Sprite({
          url: "/sprites/enemy-ranged",
          width: 32,
          height: 32,
        });

        // Debug log for sprite states
        console.log("Sprite states after creation:", {
          player: {
            url: playerSprite.getUrl(),
            loaded: playerSprite.isReady(),
            imageComplete: playerSprite.getImage().complete,
          },
          basic: {
            url: basicEnemySprite.getUrl(),
            loaded: basicEnemySprite.isReady(),
            imageComplete: basicEnemySprite.getImage().complete,
          },
          flanker: {
            url: flankerEnemySprite.getUrl(),
            loaded: flankerEnemySprite.isReady(),
            imageComplete: flankerEnemySprite.getImage().complete,
          },
          ranged: {
            url: rangedEnemySprite.getUrl(),
            loaded: rangedEnemySprite.isReady(),
            imageComplete: rangedEnemySprite.getImage().complete,
          },
        });

        // Force load all sprites manually with increased timeout
        Promise.all([
          playerSprite
            .forceLoad(10000)
            .then(() => console.log("Player sprite loaded successfully"))
            .catch((err) => console.error("Player sprite load failed:", err)),
          basicEnemySprite
            .forceLoad(10000)
            .then(() => console.log("Basic enemy sprite loaded successfully"))
            .catch((err) =>
              console.error("Basic enemy sprite load failed:", err)
            ),
          flankerEnemySprite
            .forceLoad(10000)
            .then(() => console.log("Flanker enemy sprite loaded successfully"))
            .catch((err) =>
              console.error("Flanker enemy sprite load failed:", err)
            ),
          rangedEnemySprite
            .forceLoad(10000)
            .then(() => console.log("Ranged enemy sprite loaded successfully"))
            .catch((err) =>
              console.error("Ranged enemy sprite load failed:", err)
            ),
        ])
          .then(() => {
            console.log("All sprites force-loaded successfully");

            // Debug log for sprite states after loading
            console.log("Sprite states after loading:", {
              player: {
                url: playerSprite.getUrl(),
                loaded: playerSprite.isReady(),
                imageComplete: playerSprite.getImage().complete,
              },
              basic: {
                url: basicEnemySprite.getUrl(),
                loaded: basicEnemySprite.isReady(),
                imageComplete: basicEnemySprite.getImage().complete,
              },
              flanker: {
                url: flankerEnemySprite.getUrl(),
                loaded: flankerEnemySprite.isReady(),
                imageComplete: flankerEnemySprite.getImage().complete,
              },
              ranged: {
                url: rangedEnemySprite.getUrl(),
                loaded: rangedEnemySprite.isReady(),
                imageComplete: rangedEnemySprite.getImage().complete,
              },
            });

            EnemyFactory.setEnemySprite(EnemyType.Basic, basicEnemySprite);
            EnemyFactory.setEnemySprite(EnemyType.Flanker, flankerEnemySprite);
            EnemyFactory.setEnemySprite(EnemyType.Ranged, rangedEnemySprite);

            // Check if enemy sprites are loaded
            SpriteManager.checkEnemySpritesLoaded();

            // Initialize systems
            const inputSystem = new InputSystem(inputManager);
            const renderSystem = new RenderSystem(game.getCanvas());
            const characterSystem = new CharacterControllerSystem(inputManager);
            const debugSystem = new DebugSystem(game.getCanvas(), inputManager);
            const aiBehaviorSystem = new AIBehaviorSystem();
            const waveSpawnSystem = new WaveSpawnSystem(world);

            // Store reference to debug system for debugging
            (window as CustomWindow).debugSystem = debugSystem;

            // Log debug system state
            console.log("DebugSystem initialized:", {
              system: debugSystem.constructor.name,
              requirements: debugSystem.getRequiredComponents(),
              isEnabled: (debugSystem as unknown as { isEnabled: boolean })
                .isEnabled,
            });

            // Make sure React state matches initial DebugSystem state
            const debugSystemEnabled = (
              debugSystem as unknown as { isEnabled: boolean }
            ).isEnabled;
            if (debug !== debugSystemEnabled) {
              console.log(
                "Synchronizing initial React state with DebugSystem",
                {
                  reactState: debug,
                  debugSystemState: debugSystemEnabled,
                }
              );
              setDebug(debugSystemEnabled);
            }

            // Create wave spawn system with boundary config
            const boundary = {
              width: 800,
              height: 600,
              padding: 50,
            };

            const waveConfig: WaveConfig[] = [
              {
                enemies: [
                  { type: EnemyType.Basic, count: 5 },
                  { type: EnemyType.Flanker, count: 2 },
                ],
                spawnDelay: 2000,
                waveDelay: 5000,
              },
              {
                enemies: [
                  { type: EnemyType.Basic, count: 8 },
                  { type: EnemyType.Flanker, count: 3 },
                  { type: EnemyType.Ranged, count: 2 },
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
            waveSpawnSystem.setSpawnPattern("sequential");

            // Add systems to world in correct order
            world.addSystem(inputSystem);
            world.addSystem(characterSystem);
            world.addSystem(waveSpawnSystem);
            world.addSystem(aiBehaviorSystem);
            world.addSystem(debugSystem);
            world.addSystem(renderSystem);

            // Create WorldSystem to manage world updates
            const worldSystem = new WorldSystem(world);

            // Add only the WorldSystem to the game
            game.addSystem(worldSystem);

            // Create and add player after systems are initialized
            const player = createPlayer(playerSprite);
            world.addEntity(player);

            // Check if player has the required components for DebugSystem
            const debugRequirements = debugSystem.getRequiredComponents();
            const playerHasRequiredComponents = debugRequirements.every(
              (component) => player.hasComponent(component)
            );

            console.log("Player component check for DebugSystem:", {
              playerComponents: player.getComponents().map((c) => c.getType()),
              debugRequirements,
              playerHasRequiredComponents,
            });

            // Process a full update cycle to ensure entity is registered
            world.processEntityChanges();
            world.update(0);
            world.fixedUpdate(1 / 60); // Process one physics frame

            // Debug log initial state
            console.log("Initial world state:", {
              entityCount: world.getEntities().length,
              playerComponents: player.getComponents().map((c) => ({
                type: c.getType(),
                name: c.constructor.name,
              })),
              systems: world.getSystems().map((s) => ({
                name: s.constructor.name,
                entities: s.getEntities().length,
                requirements: s.getRequiredComponents(),
              })),
            });

            // Start the wave system
            waveSpawnSystem.startNextWave();

            // Check sprite loading status again before starting the game
            SpriteManager.checkEnemySpritesLoaded();

            // Start the game
            game.start();

            // Store reference for debugging
            if (typeof window !== "undefined") {
              (window as CustomWindow).game = game;
              console.log(
                "Game reference stored in window object for debugging"
              );

              // Also store the world reference for direct access
              (window as CustomWindow).gameWorld = world;
              console.log(
                "World reference stored in window object for debugging"
              );
            }

            // Add debug logging for wave spawn system
            setInterval(() => {
              const remainingEnemies = waveSpawnSystem.getRemainingEnemies();
              const currentWave = waveSpawnSystem.getCurrentWave();
              const entities = world.getEntities();
              const enemyCount = entities.filter((e) =>
                e.hasComponent("enemy")
              ).length;
              const systems = world.getSystems();

              console.log("Wave Status:", {
                currentWave,
                remainingEnemies,
                totalEntities: entities.length,
                enemyCount,
                renderEntities: renderSystem.getEntities().length,
                systems: systems.map((s) => ({
                  name: s.constructor.name,
                  entities: s.getEntities().length,
                })),
              });
            }, 2000);
          })
          .catch((error) => {
            console.error("Failed to force-load sprites:", error);
          });
      })
      .catch((error) => {
        console.error("Failed to preload essential sprites:", error);
      });

    // Cleanup on unmount
    return () => {
      game.stop();
      inputManager.dispose();
      world.clear();
      clearInterval(redrawInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", keyListener);
      }
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
        position: "relative",
      }}
    >
      {/* Debug State Indicator */}
      {debug && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1002,
            backgroundColor: "#00aa00",
            color: "white",
            padding: "5px 10px",
            borderRadius: "3px",
            fontWeight: "bold",
            opacity: 0.8,
            boxShadow: "0 0 4px rgba(0,0,0,0.5)",
          }}
        >
          Debug: ON
        </div>
      )}

      {/* Game Controls */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          zIndex: 1001,
        }}
      >
        {/* Placeholder for game controls */}
      </div>
    </div>
  );
}

// Helper function to create player entity
function createPlayer(sprite: Sprite): Entity {
  const player = new Entity();

  // Get sprite dimensions to correctly position the player
  const dimensions = sprite.getDimensions();

  // Add transform component - position is at the center of the screen
  const transform = new Transform();
  transform.setPosition({ x: 400, y: 300 }); // Center of 800x600 canvas
  player.addComponent(transform);

  // Add renderer component
  const renderer = new Renderer(sprite);
  renderer.setZIndex(10); // Ensure player is drawn above other entities
  player.addComponent(renderer);

  // Add character controller with improved parameters for better movement
  const controller = new CharacterController({
    maxSpeed: 300,
    acceleration: 2000,
    deceleration: 1500,
  });
  player.addComponent(controller);

  // Add player component to identify as player
  player.addComponent(new Player());

  // Set an initial aim direction to test debug visualization
  const playerController = player.getComponent(
    "character-controller"
  ) as CharacterController;
  if (playerController) {
    // Only set aim direction initially; remove default movement to prevent drifting
    playerController.setAimDirection({ x: 1, y: 0 });
  }

  // Debug log component types
  console.log("Player entity created:", {
    position: transform.getPosition(),
    dimensions,
    sprite: {
      url: sprite.getUrl(),
      loaded: sprite.isReady(),
    },
    components: player.getComponents().map((c) => ({
      type: c.getType(),
      name: c.constructor.name,
    })),
  });

  return player;
}
