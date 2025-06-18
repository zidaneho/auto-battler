import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";

/** Base numbers author-time designers tweak. Never mutate after spawn. */
export class UnitStats extends GameComponent {
  /* --- core stats --- */
  readonly maxHealth: number;
  readonly baseArmor: number;
  readonly baseMagArmor: number;

  readonly baseAttack: number;
  readonly baseAttackSpeed: number;
  readonly baseCritChance: number;
  readonly baseAttackRange: number;
  readonly baseMoveSpeed: number;
  readonly baseHealingPower : number;
  readonly baseEvasion : number;

  level : number;

  constructor(
    go: GameObject,
    maxHealth: number,
    baseArmor: number,
    baseMagArmor: number,
    baseAttack: number,
    baseAttackSpeed: number,
    baseCritChance: number,
    baseRange: number,
    baseMoveSpeed: number,
    baseHealingPower:number,
  ) {
    super(go);
    this.maxHealth = maxHealth;
    this.baseArmor = baseArmor;
    this.baseMagArmor = baseMagArmor;
    this.baseAttack = baseAttack;
    this.baseAttackSpeed = baseAttackSpeed;
    this.baseCritChance = baseCritChance;
    this.baseAttackRange = baseRange;
    this.baseMoveSpeed = baseMoveSpeed;
    this.baseHealingPower = baseHealingPower;
    this.baseEvasion = 1;
    this.level = 1;
  }
}
