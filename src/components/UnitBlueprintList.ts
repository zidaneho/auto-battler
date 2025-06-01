import * as THREE from "three";
import { Knight } from "../units/Knight";
import { UnitBlueprint } from "./UnitBlueprint";
import { Archer } from "../units/Archer";
import { Priest } from "../units/Priest";

export const knightBlueprint: UnitBlueprint = {
  unitClass: Knight,
  modelKey: "knight1",
  name: "Knight",
  cost: 50,
  stats: {
    moveSpeed: 1,
    attackSpeed: 1,
    health: 20,
    attack: 5,
    healingPower: 0,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
};
export const archerBlueprint: UnitBlueprint = {
  unitClass: Archer,
  modelKey: "archer1",
  name: "Archer",
  cost: 50,
  stats: {
    moveSpeed: 1,
    attackSpeed: 1,
    health: 10,
    attack: 3,
    healingPower: 0,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
};
export const priestBlueprint: UnitBlueprint = {
  unitClass: Priest,
  modelKey: "priest1",
  name: "Priest",
  cost: 50,
  stats: {
    moveSpeed: 1,
    attackSpeed: 1,
    health: 10,
    attack: 3,
    healingPower: 4,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
};

// Helper array of all blueprints
export const allUnitBlueprints: UnitBlueprint[] = [
  knightBlueprint,
  archerBlueprint,
  priestBlueprint,
];
