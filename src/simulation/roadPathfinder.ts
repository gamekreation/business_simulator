import { GameState } from "../database/supabaseClient";
import { BUILDING_CONFIGS } from "../buildings/buildingConfig";

/**
 * Checks if a road tile (rx, ry) is adjacent to a building's rectangular footprint.
 */
export function isAdjacent(bx: number, by: number, bw: number, bh: number, rx: number, ry: number): boolean {
  // A tile is adjacent if it touches any of the 4 outer orthogonal boundaries of the building footprint:
  // - Top boundary: y = by - 1, x in [bx, bx + bw - 1]
  // - Bottom boundary: y = by + bh, x in [bx, bx + bw - 1]
  // - Left boundary: x = bx - 1, y in [by, by + bh - 1]
  // - Right boundary: x = bx + bw, y in [by, by + bh - 1]
  
  const isTop = (ry === by - 1) && (rx >= bx && rx < bx + bw);
  const isBottom = (ry === by + bh) && (rx >= bx && rx < bx + bw);
  const isLeft = (rx === bx - 1) && (ry >= by && ry < by + bh);
  const isRight = (rx === bx + bw) && (ry >= by && ry < by + bh);

  return isTop || isBottom || isLeft || isRight;
}

/**
 * Computes road connectivity for all buildings and companies.
 * Returns a Set containing the IDs of all connected entities.
 */
export function getConnectedBuildings(state: GameState): Set<string> {
  const connected = new Set<string>();
  const logHq = state.buildings.find(b => b.type === "logistics_hq");
  
  // If there is no Logistics HQ built yet (e.g. initial tutorial steps), 
  // we count any building as connected as long as it has at least one adjacent road tile.
  if (!logHq) {
    state.buildings.forEach(b => {
      const config = BUILDING_CONFIGS[b.type];
      if (!config) return;
      const bw = config.width || 1;
      const bh = config.height || 1;
      
      const hasAdjRoad = (state.roads || []).some(r => isAdjacent(b.x, b.y, bw, bh, r.x, r.y));
      if (hasAdjRoad || ["town_hall", "trade_center", "warehouse"].includes(b.type)) {
        connected.add(b.id);
      }
    });
    return connected;
  }

  // 1. Build road graph structure for efficient traversal
  const roads = state.roads || [];
  const roadMap: Record<string, string[]> = {};
  const roadSet = new Set(roads.map(r => `${r.x},${r.y}`));

  roads.forEach(r => {
    const key = `${r.x},${r.y}`;
    roadMap[key] = [];
    const neighbors = [
      { x: r.x + 1, y: r.y },
      { x: r.x - 1, y: r.y },
      { x: r.x, y: r.y + 1 },
      { x: r.x, y: r.y - 1 }
    ];
    neighbors.forEach(n => {
      const nKey = `${n.x},${n.y}`;
      if (roadSet.has(nKey)) {
        roadMap[key].push(nKey);
      }
    });
  });

  // 2. Find roads adjacent to Logistics HQ
  const lHqConfig = BUILDING_CONFIGS.logistics_hq;
  const lHqW = lHqConfig.width || 2;
  const lHqH = lHqConfig.height || 2;
  const startingRoads = roads.filter(r => isAdjacent(logHq.x, logHq.y, lHqW, lHqH, r.x, r.y));

  // If no roads touch the Logistics HQ, only the Logistics HQ itself is connected
  if (startingRoads.length === 0) {
    connected.add(logHq.id);
    return connected;
  }

  // 3. BFS Traversal to map all roads connected to the Logistics HQ road network
  const visitedRoads = new Set<string>();
  const queue: string[] = startingRoads.map(r => `${r.x},${r.y}`);
  startingRoads.forEach(r => visitedRoads.add(`${r.x},${r.y}`));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = roadMap[current] || [];
    for (const n of neighbors) {
      if (!visitedRoads.has(n)) {
        visitedRoads.add(n);
        queue.push(n);
      }
    }
  }

  // 4. Map connected buildings touching visited roads
  connected.add(logHq.id);

  state.buildings.forEach(b => {
    if (b.id === logHq.id) return;
    const config = BUILDING_CONFIGS[b.type];
    if (!config) return;
    const bw = config.width || 1;
    const bh = config.height || 1;

    const hasConnection = Array.from(visitedRoads).some(roadKey => {
      const [rx, ry] = roadKey.split(",").map(Number);
      return isAdjacent(b.x, b.y, bw, bh, rx, ry);
    });

    if (hasConnection) {
      connected.add(b.id);
    }
  });

  // Map connected companies touching visited roads
  state.companies.forEach(c => {
    const config = BUILDING_CONFIGS[c.type];
    if (!config) return;
    const bw = config.width || 1;
    const bh = config.height || 1;

    const hasConnection = Array.from(visitedRoads).some(roadKey => {
      const [rx, ry] = roadKey.split(",").map(Number);
      return isAdjacent(c.x, c.y, bw, bh, rx, ry);
    });

    if (hasConnection) {
      connected.add(c.id);
    }
  });

  return connected;
}
