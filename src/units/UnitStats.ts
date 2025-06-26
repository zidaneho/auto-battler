import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";
import { Unit } from "./Unit";

/** Base numbers author-time designers tweak. Never mutate after spawn. */
export class UnitStats extends GameComponent {
  /* --- core stats --- */
  readonly maxHealth: number;
  readonly baseArmor: number;
  readonly baseMagArmor: number;

  readonly baseAttack: number;
  readonly baseMagAttack: number;
  readonly baseAttackSpeed: number;
  readonly baseCritChance: number;
  readonly baseAttackRange: number;
  readonly baseMoveSpeed: number;
  readonly baseEvasion : number;

  level : number;
  currentExp: number;
  expToNextLevel: number;


  constructor(
    go: GameObject,
    maxHealth: number,
    baseArmor: number,
    baseMagArmor: number,
    baseAttack: number,
    baseMagAttack:number,
    baseAttackSpeed: number,
    baseCritChance: number,
    baseRange: number,
    baseMoveSpeed: number,
  ) {
    super(go);
    this.maxHealth = maxHealth;
    this.baseArmor = baseArmor;
    this.baseMagArmor = baseMagArmor;
    this.baseAttack = baseAttack;
    this.baseMagAttack = baseMagAttack;
    this.baseAttackSpeed = baseAttackSpeed;
    this.baseCritChance = baseCritChance;
    this.baseAttackRange = baseRange;
    this.baseMoveSpeed = baseMoveSpeed;
    this.baseEvasion = 1;

    this.level = 1;
    this.currentExp = 0;
    this.expToNextLevel = 100; // EXP needed to reach level 2
  }

  grantExp(amount: number): void {
    if (this.level >= 100) return; // Cap level at 100 for example

    this.currentExp += amount;
    while (this.currentExp >= this.expToNextLevel) {
      this.level++;
      this.currentExp -= this.expToNextLevel;
      // Increase the EXP required for the next level (e.g., 25% more)
      this.expToNextLevel = Math.floor(this.expToNextLevel * 1.25);
      // Mark stats as dirty to trigger a recalculation
      const unit = this.gameObject.getComponent(Unit);
      if (unit) {
          unit.dirtyStats = true;
      }
      console.log(`${this.gameObject.name} leveled up to ${this.level}!`);
    }
  }
}
