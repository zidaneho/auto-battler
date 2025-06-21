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
  stats: {
    health: 20,
    armor: 10, // Added
    magArmor: 5, // Added
    attack: 5,
    attackSpeed: 1,
    critChance: 0.1, // Added
    range: 1, // Added
    moveSpeed: 1,
    healingPower: 0,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    // Added
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
  stats: {
    health: 10,
    armor: 3, // Added
    magArmor: 2, // Added
    attack: 3,
    attackSpeed: 1,
    critChance: 0.2, // Added
    range: 5, // Added
    moveSpeed: 1,
    healingPower: 0,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    // Added
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
  stats: {
    health: 10,
    armor: 2, // Added
    magArmor: 8, // Added
    attack: 3,
    attackSpeed: 1,
    critChance: 0.05, // Added
    range: 4, // Added
    moveSpeed: 1,
    healingPower: 4,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    // Added
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
