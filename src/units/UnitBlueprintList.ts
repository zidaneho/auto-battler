import * as THREE from "three";

// Unit Class Imports
import { Knight } from "./Knight";
import { Archer } from "./Archer";
import { Priest } from "./Priest";
import { Mage } from "./Mage";
import { Peasant } from "./Peasant";
import { Commander } from "./Commander";
import { Crossbowman } from "./Crossbowman";
import { Halberdier } from "./Halberdier";
import { HeavyInfantry } from "./HeavyInfantry";
import { HeavySwordman } from "./HeavySwordman";
import { HighPriest } from "./HighPriest";
import { King } from "./King";
import { Paladin } from "./Paladin";
import { Scout } from "./Scout";
import { Spearman } from "./Spearman";
import { Swordman } from "./Swordman";
import { UnitBlueprint } from "./UnitBlueprint";

// --- MELEE BLUEPRINTS ---

export const peasantBlueprint: UnitBlueprint = {
  unitClass: Peasant,
  modelKey: "worker1",
  name: "Peasant",
  cost: 25,
  startCost: 1,
  stats: {
    health: 10,
    armor: 1,
    magArmor: 1,
    power: 2,
    magPower: 0,
    attackSpeed: 1,
    critChance: 0.05,
    range: 1,
    moveSpeed: 3,
    expValue: 10,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Pitchfork Jab",
    description: "A desperate jab with a farming tool.",
    power: 2,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const swordmanBlueprint: UnitBlueprint = {
  unitClass: Swordman,
  modelKey: "swordman", // Corrected
  name: "Swordsman",
  cost: 60,
  startCost: 1,
  stats: {
    health: 22,
    armor: 7,
    magArmor: 3,
    power: 6,
    magPower: 0,
    attackSpeed: 1.1,
    critChance: 0.1,
    range: 1.2,
    moveSpeed: 3,
    expValue: 35,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Sword Strike",
    description: "A standard sword attack.",
    power: 6,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const knightBlueprint: UnitBlueprint = {
  unitClass: Knight,
  modelKey: "knight1",
  name: "Light Infantry",
  cost: 50,
  startCost: 1,
  stats: {
    health: 25,
    armor: 10,
    magArmor: 5,
    power: 5,
    magPower: 0,
    attackSpeed: 1,
    critChance: 0.1,
    range: 1.2,
    moveSpeed: 3.2,
    expValue: 40,
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
    normalizedDmgPoint: 0.25,
  },
  useProjectiles: false,
};

export const heavySwordmanBlueprint: UnitBlueprint = {
  unitClass: HeavySwordman,
  modelKey: "heavySwordman", // Corrected
  name: "Heavy Swordsman",
  cost: 90,
  startCost: 2,
  stats: {
    health: 30,
    armor: 12,
    magArmor: 4,
    power: 8,
    magPower: 0,
    attackSpeed: 0.9,
    critChance: 0.1,
    range: 1.3,
    moveSpeed: 2.8,
    expValue: 55,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Heavy Strike",
    description: "A slow, powerful sword attack.",
    power: 8,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const heavyInfantryBlueprint: UnitBlueprint = {
  unitClass: HeavyInfantry,
  modelKey: "heavyInfantry", // Corrected
  name: "Heavy Infantry",
  cost: 100,
  startCost: 2,
  stats: {
    health: 35,
    armor: 15,
    magArmor: 5,
    power: 7,
    magPower: 0,
    attackSpeed: 0.85,
    critChance: 0.1,
    range: 1.3,
    moveSpeed: 2.5,
    expValue: 60,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Crushing Blow",
    description: "A forceful blow from a heavy weapon.",
    power: 7,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const scoutBlueprint: UnitBlueprint = {
  unitClass: Scout,
  modelKey: "scout", // Corrected
  name: "Scout",
  cost: 45,
  startCost: 1,
  stats: {
    health: 15,
    armor: 4,
    magArmor: 2,
    power: 4,
    magPower: 0,
    attackSpeed: 1.3,
    critChance: 0.15,
    range: 1,
    moveSpeed: 4.5,
    expValue: 30,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Quick Stab",
    description: "A fast and precise stab.",
    power: 4,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const spearmanBlueprint: UnitBlueprint = {
  unitClass: Spearman,
  modelKey: "spearman", // Corrected
  name: "Spearman",
  cost: 65,
  startCost: 1,
  stats: {
    health: 20,
    armor: 6,
    magArmor: 3,
    power: 5,
    magPower: 0,
    attackSpeed: 1,
    critChance: 0.1,
    range: 2.5,
    moveSpeed: 3,
    expValue: 40,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Spear Thrust",
    description: "A thrust with extended reach.",
    power: 5,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const halberdierBlueprint: UnitBlueprint = {
  unitClass: Halberdier,
  modelKey: "halberdier", // Corrected
  name: "Halberdier",
  cost: 85,
  startCost: 2,
  stats: {
    health: 28,
    armor: 9,
    magArmor: 4,
    power: 7,
    magPower: 0,
    attackSpeed: 0.9,
    critChance: 0.1,
    range: 2.8,
    moveSpeed: 2.8,
    expValue: 50,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Halberd Swing",
    description: "A wide, sweeping attack.",
    power: 7,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const commanderBlueprint: UnitBlueprint = {
  unitClass: Commander,
  modelKey: "commander", // Corrected
  name: "Commander",
  cost: 150,
  startCost: 3,
  stats: {
    health: 40,
    armor: 14,
    magArmor: 10,
    power: 9,
    magPower: 0,
    attackSpeed: 1,
    critChance: 0.15,
    range: 1.5,
    moveSpeed: 3,
    expValue: 100,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Commander's Strike",
    description: "A decisive and powerful blow.",
    power: 9,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const kingBlueprint: UnitBlueprint = {
  unitClass: King,
  modelKey: "king", // Corrected
  name: "King",
  cost: 200,
  startCost: 4,
  stats: {
    health: 50,
    armor: 18,
    magArmor: 15,
    power: 12,
    magPower: 5,
    attackSpeed: 1,
    critChance: 0.2,
    range: 1.5,
    moveSpeed: 2.8,
    expValue: 150,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Royal Decree",
    description: "An attack backed by royal authority.",
    power: 12,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

// --- RANGED BLUEPRINTS ---

export const archerBlueprint: UnitBlueprint = {
  unitClass: Archer,
  modelKey: "archer1",
  name: "Archer",
  cost: 50,
  startCost: 1,
  stats: {
    health: 12,
    armor: 3,
    magArmor: 2,
    power: 4,
    magPower: 0,
    attackSpeed: 1.1,
    critChance: 0.2,
    range: 7,
    moveSpeed: 3,
    expValue: 40,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Archer Shot",
    description: "A precise arrow shot.",
    power: 4,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.25,
  },
  useProjectiles: true,
};

export const crossbowmanBlueprint: UnitBlueprint = {
  unitClass: Crossbowman,
  modelKey: "crossbowman", // Corrected
  name: "Crossbowman",
  cost: 80,
  startCost: 2,
  stats: {
    health: 15,
    armor: 5,
    magArmor: 2,
    power: 7,
    magPower: 0,
    attackSpeed: 0.8,
    critChance: 0.25,
    range: 8,
    moveSpeed: 2.5,
    expValue: 50,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Heavy Bolt",
    description: "A powerful, armor-piercing bolt.",
    power: 7,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: true,
};

// --- MAGIC & SUPPORT BLUEPRINTS ---

export const priestBlueprint: UnitBlueprint = {
  unitClass: Priest,
  modelKey: "priest1",
  name: "Priest",
  cost: 55,
  startCost: 2,
  stats: {
    health: 15,
    armor: 2,
    magArmor: 8,
    power: 0,
    magPower: 4,
    attackSpeed: 1,
    critChance: 0.05,
    range: 6,
    moveSpeed: 2.8,
    expValue: 45,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Heal",
    description: "A divine healing light.",
    power: 4,
    accuracy: 1,
    attackType: "magical",
    normalizedDmgPoint: 0.6,
  },
  useProjectiles: false,
};

export const highPriestBlueprint: UnitBlueprint = {
  unitClass: HighPriest,
  modelKey: "highPriest", // Corrected
  name: "High Priest",
  cost: 110,
  startCost: 3,
  stats: {
    health: 25,
    armor: 4,
    magArmor: 12,
    power: 0,
    magPower: 8,
    attackSpeed: 1,
    critChance: 0.05,
    range: 7,
    moveSpeed: 2.8,
    expValue: 70,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Greater Heal",
    description: "A powerful, divine healing light.",
    power: 8,
    accuracy: 1,
    attackType: "magical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

export const mageBlueprint: UnitBlueprint = {
  unitClass: Mage,
  modelKey: "mage1",
  name: "Mage",
  cost: 70,
  startCost: 2,
  stats: {
    health: 14,
    armor: 2,
    magArmor: 10,
    power: 2,
    magPower: 8,
    attackSpeed: 0.9,
    critChance: 0.1,
    range: 7,
    moveSpeed: 3,
    expValue: 50,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Fireball",
    description: "A fiery magical blast.",
    power: 8,
    accuracy: 1,
    attackType: "magical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: true,
};

export const paladinBlueprint: UnitBlueprint = {
  unitClass: Paladin,
  modelKey: "paladin", // Corrected
  name: "Paladin",
  cost: 120,
  startCost: 3,
  stats: {
    health: 35,
    armor: 14,
    magArmor: 12,
    power: 8,
    magPower: 4,
    attackSpeed: 0.95,
    critChance: 0.1,
    range: 1.3,
    moveSpeed: 2.9,
    expValue: 75,
  },
  collider: {
    size: new THREE.Vector3(0.5, 1.5, 0.5),
    offset: new THREE.Vector3(0, 0.75, 0),
  },
  attackDef: {
    name: "Holy Strike",
    description: "A powerful strike imbued with divine energy.",
    power: 8,
    accuracy: 1,
    attackType: "physical",
    normalizedDmgPoint: 0.3,
  },
  useProjectiles: false,
};

// Helper array of all blueprints
export const allUnitBlueprints: UnitBlueprint[] = [
  // Tier 1
  peasantBlueprint,
  scoutBlueprint,
  swordmanBlueprint,
  archerBlueprint,
  knightBlueprint,
  priestBlueprint,
  mageBlueprint,
  // Tier 2
  spearmanBlueprint,
  heavySwordmanBlueprint,
  heavyInfantryBlueprint,
  crossbowmanBlueprint,
  halberdierBlueprint,
  // Tier 3
  highPriestBlueprint,
  paladinBlueprint,
  commanderBlueprint,
  // Tier 4
  kingBlueprint,
];
