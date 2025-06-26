// src/stats/HealthComponent.ts
import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";
import { AttackReport } from "./AttackReport";
import { DamageType } from "./DamageType";
import { Unit } from "@/units/Unit";

/** Live HP + mitigation for one entity */
export class HealthComponent extends GameComponent {
  /** Current hit-points (never negative). */
  health: number;

  /** Hard cap for heals. */
  maxHealth: number;

  /** Flat physical mitigation. */
  armor: number;

  /** Flat magical mitigation. */
  magArmor: number;

  /** Quality-of-life flag for systems/UI. */
  isDead = false;

  constructor(
    gameObject: GameObject,
    maxHealth: number, // blueprint value
    armor: number,
    magArmor: number
  ) {
    super(gameObject);
    this.health = maxHealth; // start full
    this.maxHealth = maxHealth;
    this.armor = armor;
    this.magArmor = magArmor;
  }

  /** Generic damage entry-point. */
  takeDamage(damageReport: AttackReport): void {
    if (this.isDead) return;

    const mitigation =
      (damageReport.damageType & DamageType.Physical) === DamageType.Physical
        ? this.armor
        : this.magArmor;
    const final = HealthComponent.mitigate(damageReport.damage, mitigation);

    this.health = Math.max(0, this.health - final);
    const justDied = !this.isDead && this.health === 0;

    // Emit takeDamage event every time
    this.gameObject.emit("takeDamage", {
      gameObject: this.gameObject,
      damageReport,
    });

    if (justDied) {
      this.isDead = true;
      // Create the payload with the unit that was killed and the attacker
      const deathPayload = {
        killed: this.gameObject.getComponent(Unit),
        killer: damageReport.attacker,
      };
      // Emit the death event WITH the payload
      this.gameObject.emit("death", deathPayload);
    }
  }

  /** Clamp heals to maxHealth by default. */
  heal(amount: number, allowOverheal = false): void {
    if (this.isDead) return;

    this.health = allowOverheal
      ? this.health + amount
      : Math.min(this.maxHealth, this.health + amount);
  }

  revive(healthPercentage: number): void {
    if (this.isDead) {
      this.health = this.maxHealth * healthPercentage;
      this.isDead = false;
    }
  }

  /** Convenience helpers ------------------------------------------------ */

  isAlive(): boolean {
    return !this.isDead;
  }

  isOverhealed(): boolean {
    return this.health > this.maxHealth;
  }

  /** % HP in [0, 1] for UI bars. */
  ratio(): number {
    return this.health / this.maxHealth;
  }

  /** Static helper: simple “diminishing returns” armor curve. */
  private static mitigate(base: number, flatArmor: number): number {
    // dmg_taken = base * 100 / (100 + armor)
    return base * (100 / (100 + Math.max(0, flatArmor)));
  }
}
  