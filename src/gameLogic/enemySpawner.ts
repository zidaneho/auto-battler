import { GameObjectManager } from "@/ecs/GameObjectManager";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { UnitManager } from "@/units/UnitManager";
import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { spawnSingleUnit } from "../units/unitActions";
import { enemyProfiles, SpawnArea } from "./enemyProfiles";
import {
  GridTile,
  UnitPlacementSystemHandle,
} from "../components/UnitPlacementSystem";
import { Unit } from "@/units/Unit";

export const ENEMY_TEAM_ID = 2;

// The parameters interface is updated to take individual systems
interface EnemySpawnerParams {
  budget: number;
  currentRound: number;
  unitManager: UnitManager;
  gameObjectManager: GameObjectManager;
  placementSystem: UnitPlacementSystemHandle;
  scene: THREE.Scene;
  world: RAPIER.World;
  projectileManager: ProjectileManager;
}

// The function now destructures the individual systems from its parameters
export function spawnEnemyWave({
  budget,
  currentRound,
  unitManager,
  gameObjectManager,
  placementSystem,
  scene,
  world,
  projectileManager,
}: EnemySpawnerParams) {
  if (!placementSystem) {
    console.error("Placement system not available for spawning enemies.");
    return;
  }

  const gridTiles = placementSystem.getGridTiles();
  if (!gridTiles || gridTiles.length === 0 || gridTiles[0].length === 0) {
    console.error("Grid tiles not available or invalid.");
    return;
  }

  let remainingBudget = budget;

  // --- Define Enemy Spawn Zones ---
  const totalRows = gridTiles.length;
  const enemyHalfStartRow = Math.floor(totalRows / 2);
  const enemyRowCount = totalRows - enemyHalfStartRow;
  let frontRowsEndIndex: number;
  let backRowsStartIndex: number;

  if (enemyRowCount <= 0) {
    console.error("No rows available for enemy spawning.");
    return;
  } else if (enemyRowCount === 1) {
    frontRowsEndIndex = enemyHalfStartRow + 1;
    backRowsStartIndex = enemyHalfStartRow;
  } else {
    const numFrontRows = Math.ceil(enemyRowCount / 2);
    frontRowsEndIndex = enemyHalfStartRow + numFrontRows;
    backRowsStartIndex = frontRowsEndIndex;
    if (backRowsStartIndex >= totalRows) {
      backRowsStartIndex = frontRowsEndIndex - 1;
    }
  }

  // --- Collect all available TILE OBJECTS for each zone ---
  const availableSlots: { front: GridTile[]; back: GridTile[] } = {
    front: [],
    back: [],
  };

  for (let r = enemyHalfStartRow; r < totalRows; r++) {
    for (let c = 0; c < gridTiles[r].length; c++) {
      const tile = gridTiles[r][c];
      if (r < frontRowsEndIndex) {
        availableSlots.front.push(tile);
      }
      if (r >= backRowsStartIndex) {
        availableSlots.back.push(tile);
      }
    }
  }
  shuffleArray(availableSlots.front);
  shuffleArray(availableSlots.back);

  // --- Spawning Loop ---
  const MAX_SPAWN_ATTEMPTS = 50;
  let attempts = 0;
  const availableEnemyProfiles = enemyProfiles.filter((profile) => true);

  if (availableEnemyProfiles.length === 0) {
    console.warn("No enemy profiles available for spawning.");
    return;
  }

  while (remainingBudget > 0 && attempts < MAX_SPAWN_ATTEMPTS) {
    attempts++;

    const affordableEnemies = availableEnemyProfiles.filter(
      (profile) => profile.spawnCost <= remainingBudget
    );
    if (affordableEnemies.length === 0) break;

    const selectedProfile =
      affordableEnemies[Math.floor(Math.random() * affordableEnemies.length)];

    let targetSlots: GridTile[];
    let fallbackSlots: GridTile[];

    if (selectedProfile.preferredSpawn === SpawnArea.FRONT) {
      targetSlots = availableSlots.front;
      fallbackSlots = availableSlots.back;
    } else {
      targetSlots = availableSlots.back;
      fallbackSlots = availableSlots.front;
    }

    let availableTile = getNextAvailableSlot(targetSlots, placementSystem);
    if (!availableTile) {
      availableTile = getNextAvailableSlot(fallbackSlots, placementSystem);
    }

    // The systems are now accessed directly from the function parameters
    if (availableTile) {
      const spawnPosition = availableTile.position;
      const unitGO = spawnSingleUnit({
        blueprint: selectedProfile.blueprint,
        playerIdToSpawn: ENEMY_TEAM_ID,
        scene,
        world,
        unitManager,
        gameObjectManager,
        position: spawnPosition,
        projectileManager,
      });

      if (unitGO) {
        const unit = unitGO.getComponent(Unit);
        const tile = placementSystem.getGrid(spawnPosition);
        if (unit && tile) {
          placementSystem.markOccupied(tile.row, tile.col, unit);
        }

        remainingBudget -= selectedProfile.spawnCost;
        console.log(
          `Spawned enemy: ${selectedProfile.blueprint.name} at (${tile?.row}, ${tile?.col}). Budget left: ${remainingBudget}`
        );
      } else {
        console.warn(`Failed to spawn ${selectedProfile.blueprint.name}`);
      }
    } else {
      console.log("No available spawn slots left for enemies.");
      break;
    }
  }
  console.log(
    `Enemy wave spawning complete. Final budget remaining: ${remainingBudget}`
  );
}

// Helper functions remain unchanged
function getNextAvailableSlot(
  slotList: GridTile[],
  placementSystem: UnitPlacementSystemHandle
): GridTile | undefined {
  while (slotList.length > 0) {
    const tile = slotList.pop();
    if (tile && tile.occupiedUnit == null) {
      return tile;
    }
  }
  return undefined;
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
