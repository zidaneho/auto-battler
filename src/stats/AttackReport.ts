import { DamageType } from "./DamageType";

export type AttackReport = {
  damage: number;
  damageType: DamageType;
  ccDuration: number; // only actually applies if damageType contains a crowd control
};
