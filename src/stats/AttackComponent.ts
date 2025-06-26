import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";
import { AttackReport } from "./AttackReport";
import { DamageType } from "./DamageType";
import { Unit } from "@/units/Unit";

export class AttackComponent extends GameComponent {
  attack: number;
  magAttack: number;
  attackSpeed: number; // swings per second
  critChance: number; // 0-1
  range: number;

  /** Countdown in seconds; system decreases each frame. */
  cooldown = 0;

  constructor(
    go: GameObject,
    attack: number,
    magAttack: number,
    attackSpeed: number,
    critChance: number,
    range: number
  ) {
    super(go);
    this.attack = attack;
    this.attackSpeed = attackSpeed;
    this.critChance = critChance;
    this.range = range;
    this.magAttack = magAttack;
  }

  getAttackReport(
    power: number,
    acc: number,
    attackType: "physical" | "magical",
    targetEvasion: number
  ): AttackReport {
    const damage = power + this.attack;
    let damageType = DamageType.Generic;
    const evadeMult = 1.0 / targetEvasion;
    const dodgeRate = acc * evadeMult;
    const hit = Math.random() <= dodgeRate;
    const crit = Math.random() <= this.critChance;
    const ccDuration = 0;
    if (!hit) {
      damageType |= DamageType.Miss;
    }
    if (crit) {
      damageType |= DamageType.Crit;
    }
    if (attackType === "physical") {
      damageType |= DamageType.Physical;
    }
    return { damage, damageType, ccDuration, attacker: this.gameObject };
  }
}
