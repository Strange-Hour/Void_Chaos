export type Vector2D = {
  x: number;
  y: number;
};

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover';

export type Weapon = {
  id: string;
  name: string;
  damage: number;
  cooldown: number;
  range: number;
};

export type Ability = {
  id: string;
  name: string;
  cooldown: number;
  effect: string;
};

export type Player = {
  position: Vector2D;
  health: number;
  maxHealth: number;
  weapons: Weapon[];
  abilities: Ability[];
  level: number;
  experience: number;
};

export type Enemy = {
  id: string;
  type: string;
  position: Vector2D;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
};

export type Item = {
  id: string;
  type: string;
  position: Vector2D;
  effect: string;
};

export type TileType = 'floor' | 'wall' | 'void' | 'hazard';

export type Tile = {
  type: TileType;
  variant: number;
};

export type TileMap = {
  width: number;
  height: number;
  tiles: Tile[][];
};

export type Level = {
  id: string;
  name: string;
  layout: TileMap;
  entities: Enemy[];
  items: Item[];
};

export type GameState = {
  status: GameStatus;
  score: number;
  wave: number;
  player: Player;
  currentLevel: Level;
  enemies: Enemy[];
  items: Item[];
};

export type GameActions = {
  // Game status actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;

  // Player actions
  updatePlayerPosition: (position: Vector2D) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  addPlayerWeapon: (weapon: Weapon) => void;
  addPlayerAbility: (ability: Ability) => void;
  gainExperience: (amount: number) => void;

  // Enemy actions
  spawnEnemy: (enemy: Enemy) => void;
  removeEnemy: (enemyId: string) => void;
  updateEnemyPosition: (enemyId: string, position: Vector2D) => void;
  damageEnemy: (enemyId: string, amount: number) => void;

  // Item actions
  spawnItem: (item: Item) => void;
  collectItem: (itemId: string) => void;

  // Level actions
  loadLevel: (level: Level) => void;
  updateWave: (wave: number) => void;

  // Score actions
  updateScore: (points: number) => void;
}; 