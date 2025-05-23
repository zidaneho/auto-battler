import * as THREE from "three";
import { Knight } from "./units/Knight";
import { UnitBlueprint } from "./UnitBlueprint";
import { Archer } from "./units/Archer";

export const knightBlueprint: UnitBlueprint = {
    unitClass: Knight,
    modelKey: "knight1",
    name: "Knight",
    stats: {
      moveSpeed: 5,
      attackSpeed: 1.2,
      health: 150,
      attack:10,
      healingPower:0,
    },
    collider: {
      size: new THREE.Vector3(1, 2, 1),
      offset: new THREE.Vector3(0, 1, 0),
    },
  };
  export const archerBlueprint: UnitBlueprint = {
    unitClass: Archer,
    modelKey: "archer1",
    name: "Knight",
    stats: {
      moveSpeed: 5,
      attackSpeed: 1.2,
      health: 150,
      attack:10,
      healingPower:0,
    },
    collider: {
      size: new THREE.Vector3(1, 2, 1),
      offset: new THREE.Vector3(0, 1, 0),
    },
  };
  export const priestBlueprint: UnitBlueprint = {
    unitClass: Archer,
    modelKey: "archer1",
    name: "Knight",
    stats: {
      moveSpeed: 5,
      attackSpeed: 1.2,
      health: 150,
      attack:10,
      healingPower:0,
    },
    collider: {
      size: new THREE.Vector3(1, 2, 1),
      offset: new THREE.Vector3(0, 1, 0),
    },
  };