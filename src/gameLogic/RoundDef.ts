import { Unit } from "@/units/Unit";
import { EnemyProfile } from "./enemyProfiles";
import { UnitBlueprint } from "@/units/UnitBlueprint";

export class RoundDef {
  roundNumber: number;
  enemies: UnitBlueprint[] | null;

  constructor(roundNumber: number, enemies: UnitBlueprint[] | null) {
    this.roundNumber = roundNumber;
    this.enemies = enemies;
  }
}