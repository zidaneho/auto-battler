import * as THREE from "three";
import { GameObject } from "./ecs/GameObject";
import { Unit } from "./units/Unit";

export type UnitBlueprint = {
  unitClass: new (gameObject: GameObject, ...args: any[]) => Unit;
  modelKey: string;
  name: string;
  iconUrl?: string;
  cost:number;
  stats: {
    moveSpeed: number;
    attack:number;
    attackSpeed: number;
    health: number;
    healingPower:number;
  };
  collider: {
    size: THREE.Vector3;
    offset: THREE.Vector3;
  };
};

