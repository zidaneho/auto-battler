import { Unit } from "@/units/Unit";
import { EnemyProfile } from "./enemyProfiles";
import { UnitBlueprint } from "@/units/UnitBlueprint";

export class RoundDef {
  roundNumber: number;
  enemies: Unit[] | null;

  constructor(roundNumber: number, enemies: Unit[] | null) {
    this.roundNumber = roundNumber;
    this.enemies = enemies;
  }
}