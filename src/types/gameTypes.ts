import { UnitManager } from "@/units/UnitManager";
import { GameObject } from "../ecs/GameObject"; // Adjust path as needed
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { UnitPlacementSystemHandle } from "@/components/UnitPlacementSystem";
import { Scene } from "three";
import { World } from "@dimforge/rapier3d";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { RoundManager } from "@/gameLogic/roundManager";

export interface PlayerUnitInstance {
  id: string; // Unique ID for the unit instance (e.g., gameObject.name)
  blueprintName: string;
  gameObject: GameObject;
}

export interface Player {
  id: number;
  gold: number;
  units: PlayerUnitInstance[];
  lastBattleWon?: boolean;
  // board: any[]; // If 'board' was intended to be part of player state, define its type here
  // It was cleared in clearBoardAndUnits but not explicitly defined in Player interface.
  // For now, I'm commenting it out based on the provided Player interface.
}

