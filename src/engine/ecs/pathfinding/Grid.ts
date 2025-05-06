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

export class Pathfinding {
  /**
   * Find a path from start to goal using A* on the given grid.
   * @param grid The Grid instance
   * @param start { x, y } grid coordinates
   * @param goal { x, y } grid coordinates
   * @returns Array of { x, y } grid cells, or [] if no path
   */
  static findPath(
    grid: Grid,
    start: { x: number; y: number },
    goal: { x: number; y: number }
  ): Array<{ x: number; y: number }> {
    // Early exit if start or goal is blocked
    if (!grid.isWalkable(start.x, start.y) || !grid.isWalkable(goal.x, goal.y)) {
      return [];
    }

    // Node structure for A*
    type Node = {
      x: number;
      y: number;
      g: number; // Cost from start
      h: number; // Heuristic
      f: number; // g + h
      parent?: Node;
    };

    // Helper to reconstruct path
    function reconstructPath(node: Node): Array<{ x: number; y: number }> {
      const path: Array<{ x: number; y: number }> = [];
      let curr: Node | undefined = node;
      while (curr) {
        path.push({ x: curr.x, y: curr.y });
        curr = curr.parent;
      }
      return path.reverse();
    }

    // Manhattan distance
    function heuristic(x: number, y: number): number {
      return Math.abs(x - goal.x) + Math.abs(y - goal.y);
    }

    // Open and closed sets
    const open: Map<string, Node> = new Map();
    const closed: Set<string> = new Set();
    function key(x: number, y: number) { return `${x},${y}`; }

    // Start node
    const startNode: Node = {
      x: start.x,
      y: start.y,
      g: 0,
      h: heuristic(start.x, start.y),
      f: heuristic(start.x, start.y),
    };
    open.set(key(start.x, start.y), startNode);

    // Directions: 4-way (up, down, left, right)
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    while (open.size > 0) {
      // Get node with lowest f
      let current: Node | undefined;
      for (const node of Array.from(open.values())) {
        if (!current || node.f < current.f) current = node;
      }
      if (!current) break;
      open.delete(key(current.x, current.y));
      closed.add(key(current.x, current.y));

      // Goal reached
      if (current.x === goal.x && current.y === goal.y) {
        return reconstructPath(current);
      }

      // Explore neighbors
      for (const dir of dirs) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;
        if (!grid.inBounds(nx, ny) || !grid.isWalkable(nx, ny)) continue;
        if (closed.has(key(nx, ny))) continue;
        const g = current.g + 1;
        const h = heuristic(nx, ny);
        const f = g + h;
        const neighborKey = key(nx, ny);
        const existing = open.get(neighborKey);
        if (!existing || g < existing.g) {
          open.set(neighborKey, {
            x: nx,
            y: ny,
            g,
            h,
            f,
            parent: current,
          });
        }
      }
    }
    // No path found
    return [];
  }
} 