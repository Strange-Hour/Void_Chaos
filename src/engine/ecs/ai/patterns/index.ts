/**
 * MovementPatternRegistry maps pattern type strings to their runtime implementations.
 *
 * To add a new pattern:
 * 1. Implement IMovementPattern in a new file (e.g., ZigZagPattern.ts)
 * 2. Import and register it here with a unique key (e.g., 'zigzag').
 * 3. Reference the key in enemy movement state machines.
 */
import { IMovementPattern } from './types';
import { ChasePattern } from './ChasePattern';
import { FlankPattern } from './FlankPattern';
import { RetreatPattern } from './RetreatPattern';
import { IdlePattern } from './IdlePattern';
import { SearchPattern } from './SearchPattern';

export const MovementPatternRegistry: Record<string, IMovementPattern> = {
  'chase': new ChasePattern(),
  'flank': new FlankPattern(),
  'retreat': new RetreatPattern(),
  'idle': new IdlePattern(),
  'search': new SearchPattern(),
}; 