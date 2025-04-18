/**
 * Layer configuration for the game's rendering system.
 * Defines the z-index order and names for all rendering layers.
 */

export enum LayerName {
  Background = 'background',
  Debug = 'debug',
  Game = 'game',
  UI = 'ui',
  Overlay = 'overlay'
}

export enum LayerLevel {
  Background = 0,
  Debug = 1,
  Game = 2,
  UI = 3,
  Overlay = 4
}

interface LayerConfig {
  name: LayerName;
  level: LayerLevel;
  description: string;
}

/**
 * Complete configuration for each layer including metadata
 */
export const LayerConfigs: Record<LayerName, LayerConfig> = {
  [LayerName.Background]: {
    name: LayerName.Background,
    level: LayerLevel.Background,
    description: 'Base layer for background elements and environment'
  },
  [LayerName.Debug]: {
    name: LayerName.Debug,
    level: LayerLevel.Debug,
    description: 'Debug information and development overlays'
  },
  [LayerName.Game]: {
    name: LayerName.Game,
    level: LayerLevel.Game,
    description: 'Main game entities and interactive elements'
  },
  [LayerName.UI]: {
    name: LayerName.UI,
    level: LayerLevel.UI,
    description: 'User interface elements and HUD'
  },
  [LayerName.Overlay]: {
    name: LayerName.Overlay,
    level: LayerLevel.Overlay,
    description: 'Top-level overlays, popups, and notifications'
  }
};

/**
 * Helper function to get layer level by name
 */
export function getLayerLevel(name: LayerName): number {
  return LayerConfigs[name].level;
}

/**
 * Helper function to get layer config by name
 */
export function getLayerConfig(name: LayerName): LayerConfig {
  return LayerConfigs[name];
} 