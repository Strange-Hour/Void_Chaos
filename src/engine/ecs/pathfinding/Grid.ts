/**
 * Grid-based map for pathfinding (A* or similar algorithms).
 * Each cell is either walkable (true) or blocked (false).
 */

export class Grid {
  private width: number;
  private height: number;
  private cellSize: number;
  private cells: boolean[][];

  /**
   * @param width Number of columns (cells horizontally)
   * @param height Number of rows (cells vertically)
   * @param cellSize Size of each cell in world units (e.g., pixels)
   */
  constructor(width: number, height: number, cellSize: number = 32) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cells = Array.from({ length: height }, () => Array(width).fill(true));
  }

  /** Mark a cell as walkable or blocked */
  setWalkable(x: number, y: number, walkable: boolean): void {
    if (this.inBounds(x, y)) {
      this.cells[y][x] = walkable;
    }
  }

  /** Check if a cell is walkable */
  isWalkable(x: number, y: number): boolean {
    return this.inBounds(x, y) ? this.cells[y][x] : false;
  }

  /** Check if coordinates are within grid bounds */
  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /** Convert world coordinates to grid cell coordinates */
  worldToGrid(wx: number, wy: number): { x: number; y: number } {
    return {
      x: Math.floor(wx / this.cellSize),
      y: Math.floor(wy / this.cellSize),
    };
  }

  /** Convert grid cell coordinates to world coordinates (center of cell) */
  gridToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this.cellSize + this.cellSize / 2,
      y: y * this.cellSize + this.cellSize / 2,
    };
  }

  /** Get grid dimensions */
  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }
  getCellSize(): number { return this.cellSize; }
} 