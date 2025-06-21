// src/gameLogic/enemyProfiles.ts
import { UnitBlueprint } from "@/units/UnitBlueprint";
import {
  knightBlueprint,
  archerBlueprint,
  priestBlueprint,
} from "@/units/UnitBlueprintList";

export enum SpawnArea {
  FRONT,
  BACK,
}
export interface EnemyProfile {
  blueprint: UnitBlueprint;
  spawnCost: number;
  preferredSpawn: SpawnArea;
}

export const enemyProfiles: EnemyProfile[] = [
  { blueprint: knightBlueprint, spawnCost: 1, preferredSpawn: SpawnArea.FRONT },
  { blueprint: archerBlueprint, spawnCost: 1, preferredSpawn: SpawnArea.BACK },
  { blueprint: priestBlueprint, spawnCost: 5, preferredSpawn: SpawnArea.BACK },
];
