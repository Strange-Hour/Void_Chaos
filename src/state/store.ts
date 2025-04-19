import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  GameState,
  GameActions,
  Vector2D,
  Weapon,
  Ability,
  Enemy,
  Item,
  Level,
} from '../types/game';

// Initial state
const initialState: GameState = {
  status: 'menu',
  score: 0,
  wave: 1,
  player: {
    position: { x: 0, y: 0 },
    health: 100,
    maxHealth: 100,
    weapons: [],
    abilities: [],
    level: 1,
    experience: 0,
  },
  currentLevel: {
    id: 'tutorial',
    name: 'Tutorial Level',
    layout: {
      width: 0,
      height: 0,
      tiles: [],
    },
    entities: [],
    items: [],
  },
  enemies: [],
  items: [],
};

// Store type combining state and actions
type GameStore = GameState & GameActions;

// Create the store with middleware
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Game status actions
        startGame: () => set({ status: 'playing' }),
        pauseGame: () => set({ status: 'paused' }),
        resumeGame: () => set({ status: 'playing' }),
        endGame: () => set({ status: 'gameover' }),

        // Player actions
        updatePlayerPosition: (position: Vector2D) =>
          set((state) => ({
            player: {
              ...state.player,
              position,
            },
          })),

        damagePlayer: (amount: number) =>
          set((state) => {
            const newHealth = Math.max(0, state.player.health - amount);
            return {
              player: {
                ...state.player,
                health: newHealth,
              },
              status: newHealth <= 0 ? 'gameover' : state.status,
            };
          }),

        healPlayer: (amount: number) =>
          set((state) => ({
            player: {
              ...state.player,
              health: Math.min(
                state.player.maxHealth,
                state.player.health + amount
              ),
            },
          })),

        addPlayerWeapon: (weapon: Weapon) =>
          set((state) => ({
            player: {
              ...state.player,
              weapons: [...state.player.weapons, weapon],
            },
          })),

        addPlayerAbility: (ability: Ability) =>
          set((state) => ({
            player: {
              ...state.player,
              abilities: [...state.player.abilities, ability],
            },
          })),

        gainExperience: (amount: number) =>
          set((state) => {
            const newExperience = state.player.experience + amount;
            const experienceToLevel = state.player.level * 100; // Simple level scaling

            if (newExperience >= experienceToLevel) {
              return {
                player: {
                  ...state.player,
                  level: state.player.level + 1,
                  experience: newExperience - experienceToLevel,
                  maxHealth: state.player.maxHealth + 10, // Health increase per level
                  health: state.player.maxHealth + 10, // Heal on level up
                },
              };
            }

            return {
              player: {
                ...state.player,
                experience: newExperience,
              },
            };
          }),

        // Enemy actions
        spawnEnemy: (enemy: Enemy) =>
          set((state) => ({
            enemies: [...state.enemies, enemy],
          })),

        removeEnemy: (enemyId: string) =>
          set((state) => ({
            enemies: state.enemies.filter((e) => e.id !== enemyId),
          })),

        updateEnemyPosition: (enemyId: string, position: Vector2D) =>
          set((state) => ({
            enemies: state.enemies.map((enemy) =>
              enemy.id === enemyId
                ? { ...enemy, position }
                : enemy
            ),
          })),

        damageEnemy: (enemyId: string, amount: number) =>
          set((state) => {
            const updatedEnemies = state.enemies.map((enemy) => {
              if (enemy.id === enemyId) {
                const newHealth = Math.max(0, enemy.health - amount);
                return {
                  ...enemy,
                  health: newHealth,
                };
              }
              return enemy;
            });

            // Remove dead enemies and update score
            const deadEnemy = state.enemies.find(
              (e) => e.id === enemyId && e.health <= amount
            );

            if (deadEnemy) {
              return {
                enemies: updatedEnemies.filter((e) => e.health > 0),
                score: state.score + 100, // Score per kill
              };
            }

            return {
              enemies: updatedEnemies,
            };
          }),

        // Item actions
        spawnItem: (item: Item) =>
          set((state) => ({
            items: [...state.items, item],
          })),

        collectItem: (itemId: string) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== itemId),
          })),

        // Level actions
        loadLevel: (level: Level) =>
          set({
            currentLevel: level,
            enemies: level.entities,
            items: level.items,
          }),

        updateWave: (wave: number) =>
          set((state) => ({
            wave,
            score: state.score + (wave - state.wave) * 1000, // Score bonus for wave completion
          })),

        // Score actions
        updateScore: (points: number) =>
          set((state) => ({
            score: state.score + points,
          })),
      }),
      {
        name: 'void-chaos-storage',
        skipHydration: true, // We'll handle hydration manually for better control
      }
    )
  )
); 