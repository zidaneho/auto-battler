import * as THREE from "three";
import { Knight } from "./Knight";
import { UnitBlueprint } from "./UnitBlueprint";
import { Archer } from "./Archer";
import { Priest } from "./Priest";

export const knightBlueprint: UnitBlueprint = {
  unitClass: Knight,
  modelKey: "knight1",
  name: "Knight",
  cost: 50,
  startCost: 1, // Added
  stats: {
    health: 25,
    armor: 10,
    magArmor: 5,
    power: 5,
    magPower:5,
    attackSpeed: 1,
    critChance: 0.1,
    range: 1,
    moveSpeed: 3,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Knight Attack",
    description: "A strong sword swing.",
    power: 5,
    accuracy: 1,
    attackType: "physical",
  },
};
export const archerBlueprint: UnitBlueprint = {
  unitClass: Archer,
  modelKey: "archer1",
  name: "Archer",
  cost: 50,
  startCost: 1, // Added
  stats: {
    health: 10,
    armor: 3,
    magArmor: 2,
    power: 2,
    magPower: 0,
    attackSpeed: 1,
    critChance: 0.2,
    range: 5,
    moveSpeed: 2,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Archer Shot",
    description: "A precise arrow shot.",
    power: 5,
    accuracy: 1,
    attackType: "physical",
  },
};
export const priestBlueprint: UnitBlueprint = {
  unitClass: Priest,
  modelKey: "priest1",
  name: "Priest",
  cost: 50,
  startCost: 2, // Added
  stats: {
    health: 10,
    armor: 2,
    magArmor: 8,
    power: 3,
    magPower:3,
    attackSpeed: 1,
    critChance: 0.05,
    range: 4,
    moveSpeed: 1,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Priest Smite",
    description: "A divine magical attack.",
    power: 5,
    accuracy: 1,
    attackType: "magical",
  },
};

// Helper array of all blueprints
export const allUnitBlueprints: UnitBlueprint[] = [
  knightBlueprint,
  archerBlueprint,
  priestBlueprint,
];
