/**
 * One system to rebuild live stats from UnitStats + Buffs.
 * Call it:
 *   • once at spawn
 *   • whenever an item is equipped / buff added / buff expires
 */

import { StatName } from "@/stats/StatTypes";
import { Unit } from "@/units/Unit";

export class StatRefreshSystem {
  static rebuild(e: Unit, now: number) {
    e.dirtyStats = false;

    /* 1. Remove expired mods */
    e.buffComponent.mods = e.buffComponent.mods.filter(
      (m) => m.expiresAt === undefined || m.expiresAt > now
    );

    const levelFactor = 1 + (e.stats.level - 1) * 0.1;

    /* 2. Start from base */
    let hpMax = e.stats.maxHealth * levelFactor;
    let armor = e.stats.baseArmor * levelFactor;
    let magArmor = e.stats.baseMagArmor * levelFactor;
    let atk = e.stats.baseAttack * levelFactor;
    let magAtk = e.stats.baseMagAttack * levelFactor;

    let atkSpeed = e.stats.baseAttackSpeed;
    let critChance = e.stats.baseCritChance;
    let range = e.stats.baseAttackRange;
    let moveSpeed = e.stats.baseMoveSpeed;
    let evasion = e.stats.baseEvasion;

    /* 3. Aggregate modifiers */
    const flat: Partial<Record<StatName, number>> = {};
    const pct: Partial<Record<StatName, number>> = {};

    const add = (dst: any, src?: Partial<Record<StatName, number>>) => {
      if (!src) return;
      for (const k in src) {
        const key = k as StatName;
        dst[key] = (dst[key] ?? 0) + src[key]!;
      }
    };

    for (const m of e.buffComponent.mods) {
      add(flat, m.flat);
      add(pct, m.pct);
    }

    /** helper to apply pct then flat in that order */
    const calc = (base: number, name: StatName) =>
      base * (1 + (pct[name] ?? 0)) + (flat[name] ?? 0);

    /* 4. Write back */
    e.healthComponent.maxHealth = hpMax = calc(hpMax, "maxHealth");
    e.healthComponent.armor = armor = calc(armor, "armor");
    e.healthComponent.magArmor = magArmor = calc(magArmor, "magArmor");

    e.attackComponent.attack = calc(atk, "attack");
    e.attackComponent.magAttack = calc(magAtk, "magAttack");
    e.attackComponent.attackSpeed = calc(atkSpeed, "attackSpeed");
    e.attackComponent.critChance = calc(critChance, "critChance");
    e.attackComponent.range = calc(range, "attackRange");

    e.moveSpeed = calc(moveSpeed, "moveSpeed");
    e.evasion = calc(evasion,"evasion");

    /* 5. Clamp current HP if max changed */
    e.healthComponent.health = Math.min(
      e.healthComponent.health,
      e.healthComponent.maxHealth
    );
  }
}
