/* Central place for stat names so you can extend safely later. */
export type StatName =
  | "maxHealth"
  | "armor"
  | "magArmor"
  | "attack"
  | "magAttack"
  | "attackSpeed"
  | "critChance"
  | "attackRange"
  | "moveSpeed"
  | "healingPower"
  | "evasion";

export interface StatModifier {
  /** Flat delta applied *after* all percent mods. */
  flat?: Partial<Record<StatName, number>>;
  /** Percent delta – e.g. 0.20 = +20 %. */
  pct?: Partial<Record<StatName, number>>;
  /** Optional expiry time (seconds since level load). */
  expiresAt?: number;
  /** Helpful for debugging / removing. */
  source?: string;
}
