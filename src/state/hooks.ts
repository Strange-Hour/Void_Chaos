import { useEffect, useState } from 'react';
import { useGameStore } from './store';
import { GameState, GameActions, Player } from '../types/game';

type StoreState = GameState & GameActions;

export function useHydratedGameStore<T>(
  selector: (state: StoreState) => T,
  defaultValue: T
): T {
  const [hydrated, setHydrated] = useState(false);
  const value = useGameStore(selector);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? value : defaultValue;
}

// Example selectors for common state access
export const usePlayerState = () =>
  useHydratedGameStore<Player>((state) => state.player, {
    position: { x: 0, y: 0 },
    health: 100,
    maxHealth: 100,
    weapons: [],
    abilities: [],
    level: 1,
    experience: 0,
  });

export const useGameStatus = () =>
  useHydratedGameStore<GameState['status']>((state) => state.status, 'menu');

export const useEnemies = () =>
  useHydratedGameStore<GameState['enemies']>((state) => state.enemies, []);

export const useItems = () =>
  useHydratedGameStore<GameState['items']>((state) => state.items, []);

export const useScore = () =>
  useHydratedGameStore<GameState['score']>((state) => state.score, 0);

export const useWave = () =>
  useHydratedGameStore<GameState['wave']>((state) => state.wave, 1);

// Example selector for game actions
type GameActionSelectors = {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  updatePlayerPosition: GameActions['updatePlayerPosition'];
  damagePlayer: GameActions['damagePlayer'];
  healPlayer: GameActions['healPlayer'];
  spawnEnemy: GameActions['spawnEnemy'];
  damageEnemy: GameActions['damageEnemy'];
  updateScore: GameActions['updateScore'];
};

export const useGameActions = () =>
  useHydratedGameStore<GameActionSelectors>(
    (state) => ({
      startGame: state.startGame,
      pauseGame: state.pauseGame,
      resumeGame: state.resumeGame,
      endGame: state.endGame,
      updatePlayerPosition: state.updatePlayerPosition,
      damagePlayer: state.damagePlayer,
      healPlayer: state.healPlayer,
      spawnEnemy: state.spawnEnemy,
      damageEnemy: state.damageEnemy,
      updateScore: state.updateScore,
    }),
    {
      startGame: () => { },
      pauseGame: () => { },
      resumeGame: () => { },
      endGame: () => { },
      updatePlayerPosition: () => { },
      damagePlayer: () => { },
      healPlayer: () => { },
      spawnEnemy: () => { },
      damageEnemy: () => { },
      updateScore: () => { },
    }
  ); 