import { Unit } from "@/units/Unit";
import { EnemyProfile } from "./enemyProfiles";
import { UnitBlueprint } from "@/units/UnitBlueprint";
import { AttackReport } from "@/stats/AttackReport";

export interface EnemyUnitInstance {
  unit: Unit;
  attackers: Unit[];
}

export class RoundDef {
  roundNumber: number;
  enemies: EnemyUnitInstance[] | null;

  constructor(roundNumber: number, enemies: Unit[] | null) {
    this.roundNumber = roundNumber;
    this.enemies = enemies
      ? enemies.map((enemy) => ({ unit: enemy, attackers: [] }))
      : null;
  }
}
