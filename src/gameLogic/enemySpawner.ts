import { GameObjectManager } from "@/ecs/GameObjectManager";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { UnitManager } from "@/units/UnitManager";
import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { spawnSingleUnit } from "./unitActions"; // Assuming this is in the same gameLogic folder
import { enemyProfiles, EnemyProfile, SpawnArea } from "./enemyProfiles"; // Assuming this is in the same gameLogic folder
import { UnitPlacementSystemHandle } from "../components/UnitPlacementSystem"; // Adjusted path

export const ENEMY_TEAM_ID = 2; // Define a constant for the enemy team

interface EnemySpawnerParams {
  budget: number;
  currentRound: number; // Useful for future enhancements like minWaveToAppear
  scene: THREE.Scene;
  world: RAPIER.World;
  unitManager: UnitManager;
  gameObjectManager: GameObjectManager;
  projectileManager: ProjectileManager | null;
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>;
}

export function spawnEnemyWave({
  budget,
  currentRound,
  scene,
  world,
  unitManager,
  gameObjectManager,
  projectileManager,
  placementRef,
}: EnemySpawnerParams) {
  if (!placementRef?.current) {
    console.error("Placement system not available for spawning enemies.");
    return;
  }

  const gridPositions = placementRef.current.getGridPositions();
  if (!gridPositions || gridPositions.length === 0 || gridPositions[0].length === 0) {
    console.error("Grid positions not available or invalid.");
    return;
  }

  let remainingBudget = budget;
  const spawnedPositions: Set<string> = new Set(); // To track occupied slots "{row}-{col}"

  // --- Define Enemy Spawn Zones ---
  // Assuming a grid where player occupies the first half of rows, enemies the second.
  const totalRows = gridPositions.length;
  const enemyHalfStartRow = Math.floor(totalRows / 2); // e.g., if 6 rows (0-5), enemies start at row 3

  // Further divide enemy rows into FRONT and BACK
  // Example: For 3 enemy rows (e.g., 3, 4, 5 on a 6-row grid)
  // FRONT: First 1 or 2 rows of enemy side
  // BACK: Last 1 row of enemy side
  const enemyRowCount = totalRows - enemyHalfStartRow;
  let frontRowsEndIndex: number; // Exclusive end index for front rows
  let backRowsStartIndex: number; // Inclusive start index for back rows

  if (enemyRowCount <= 0) {
      console.error("No rows available for enemy spawning.");
      return;
  } else if (enemyRowCount === 1) { // Only one row for enemies
      frontRowsEndIndex = enemyHalfStartRow + 1; // That one row is both front and back
      backRowsStartIndex = enemyHalfStartRow;
  } else {
      // Example: if 3 enemy rows, 2 front (e.g. rows 3,4), 1 back (e.g. row 5)
      // if 2 enemy rows, 1 front (e.g. row 3), 1 back (e.g. row 4)
      const numFrontRows = Math.ceil(enemyRowCount / 2);
      frontRowsEndIndex = enemyHalfStartRow + numFrontRows;
      backRowsStartIndex = frontRowsEndIndex; // Back rows start where front rows end
      if (backRowsStartIndex >= totalRows) { // Ensure back rows don't go out of bounds if only front rows exist
          backRowsStartIndex = frontRowsEndIndex -1; // Make last front row also the back row
      }
  }


  // --- Collect all available slots for each zone ---
  const availableSlots: { front: THREE.Vector3[]; back: THREE.Vector3[] } = {
    front: [],
    back: [],
  };

  for (let r = enemyHalfStartRow; r < totalRows; r++) {
    for (let c = 0; c < gridPositions[r].length; c++) {
      const position = gridPositions[r][c];
      if (r < frontRowsEndIndex) { // This row is part of the FRONT zone
        availableSlots.front.push(position.clone());
      }
      if (r >= backRowsStartIndex) { // This row is part of the BACK zone
        availableSlots.back.push(position.clone());
      }
    }
  }
  // Shuffle slots to make placement less predictable within a zone
  shuffleArray(availableSlots.front);
  shuffleArray(availableSlots.back);


  // --- Spawning Loop ---
  const MAX_SPAWN_ATTEMPTS = 50; // Safety break
  let attempts = 0;

  const availableEnemyProfiles = enemyProfiles.filter(profile => {
    // Later, you can add: currentRound >= profile.minWaveToAppear
    return true;
  });

  if (availableEnemyProfiles.length === 0) {
    console.warn("No enemy profiles available for spawning.");
    return;
  }

  while (remainingBudget > 0 && attempts < MAX_SPAWN_ATTEMPTS) {
    attempts++;

    // Filter affordable enemies
    const affordableEnemies = availableEnemyProfiles.filter(
      (profile) => profile.spawnCost <= remainingBudget
    );

    if (affordableEnemies.length === 0) {
      break; // No more enemies can be afforded
    }

    // Select a random enemy from affordable ones
    // TODO: Consider spawnWeight if added to EnemyProfile
    const selectedProfile =
      affordableEnemies[Math.floor(Math.random() * affordableEnemies.length)];

    let spawnPosition: THREE.Vector3 | undefined = undefined;
    let targetSlots: THREE.Vector3[];
    let fallbackSlots: THREE.Vector3[];

    if (selectedProfile.preferredSpawn === SpawnArea.FRONT) {
      targetSlots = availableSlots.front;
      fallbackSlots = availableSlots.back;
    } else { // SpawnArea.BACK
      targetSlots = availableSlots.back;
      fallbackSlots = availableSlots.front;
    }

    // Try to find a position in the preferred zone
    spawnPosition = getNextAvailableSlot(targetSlots, spawnedPositions, gridPositions);

    // If preferred zone is full, try fallback zone
    if (!spawnPosition) {
      spawnPosition = getNextAvailableSlot(fallbackSlots, spawnedPositions, gridPositions);
    }
    
    if (spawnPosition) {
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
        remainingBudget -= selectedProfile.spawnCost;
        // Mark position as occupied by finding its row/col again (or store row/col with position)
        // For simplicity, this example assumes getNextAvailableSlot handles removing the slot or it won't be picked again
        // A more robust way is to remove the exact Vector3 object from the availableSlots arrays
        console.log(
          `Spawned enemy: ${selectedProfile.blueprint.name} at (${spawnPosition.x.toFixed(2)}, ${spawnPosition.z.toFixed(2)}). Budget left: ${remainingBudget}`
        );
      } else {
        // Spawning failed, don't decrement budget, maybe log error
        console.warn(`Failed to spawn ${selectedProfile.blueprint.name}`);
      }
    } else {
      // No available slots left for any type of enemy
      console.log("No available spawn slots left for enemies.");
      break;
    }
  }
  console.log(`Enemy wave spawning complete. Final budget remaining: ${remainingBudget}`);
}


// Helper function to get the next available slot and remove it from the list
function getNextAvailableSlot(
    slotList: THREE.Vector3[],
    _spawnedPositions: Set<string>, // Currently unused as we modify slotList directly
    _gridPositions: THREE.Vector3[][] // Unused here, but could be useful for complex key generation
): THREE.Vector3 | undefined {
  // A simple way: if we shuffle the slotList initially, we can just pop.
  // This ensures a slot isn't picked twice.
  if (slotList.length > 0) {
    return slotList.pop(); // Removes and returns the last element
  }
  return undefined;
}


// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
