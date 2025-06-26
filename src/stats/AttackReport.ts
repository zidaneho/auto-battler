import { Unit } from "@/units/Unit";
import { DamageType } from "./DamageType";
import { GameObject } from "@/ecs/GameObject";

export type AttackReport = {
  damage: number;
  damageType: DamageType;
  ccDuration: number; // only actually applies if damageType contains a crowd control
  attacker : GameObject | null;
};
