import * as THREE from "three";
import { GameObject } from "../ecs/GameObject";
import { Unit } from "./Unit";

export type UnitBlueprint = {
  unitClass: new (gameObject: GameObject, ...args: any[]) => Unit;
  modelKey: string;
  name: string;
  iconUrl?: string;
  cost: number;
  stats: UnitBlueprintStats;
  collider: {
    size: THREE.Vector3;
    offset: THREE.Vector3;
  };
  attackDef: AttackDef;
};

export type AttackDef = {
  name: string;
  description: string;
  power: number;
  accuracy: number; //0.0-1.0
  attackType: "physical" | "magical";
};

export type UnitBlueprintStats = {
  health: number;
  armor: number;
  magArmor: number;
  attack: number;
  attackSpeed: number;
  critChance: number;
  range: number;
  moveSpeed: number;
  healingPower: number;
};
