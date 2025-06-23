import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";

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
  }
}
