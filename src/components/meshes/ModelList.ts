import { GLTF } from "three/examples/jsm/Addons";
import { AnimationClip } from "three";
import * as THREE from "three";

export interface ModelEntry {
  url: string;
}

export const models: Record<string, ModelEntry> = {
  //UNITS
  archer1: { url: "/models/gltf/TT_Archer.glb"},
  knight1: { url: "/models/gltf/TT_Light_Infantry.glb"},
  mage1: { url: "/models/gltf/TT_Mage.glb" },
  worker1: { url: "/models/gltf/TT_Peasant.glb" },
  priest1: { url: "/models/gltf/TT_Priest.glb" },
  commander: { url: "/models/gltf/TT_Commander.glb" },
  crossbowman: { url: "/models/gltf/TT_Crossbowman.glb" },
  halberdier: { url: "/models/gltf/TT_Halberdier.glb" },
  heavyInfantry: { url: "/models/gltf/TT_Heavy_Infantry.glb" },
  heavySwordman: { url: "/models/gltf/TT_HeavySwordman.glb" },
  highPriest: { url: "/models/gltf/TT_HighPriest.glb" },
  king: { url: "/models/gltf/TT_King.glb" },
  paladin: { url: "/models/gltf/TT_Paladin.glb" },
  scout: { url: "/models/gltf/TT_Scout.glb" },
  spearman: { url: "/models/gltf/TT_Spearman.glb" },
  swordman: { url: "/models/gltf/TT_Swordman.glb" },

  //PROJECTILES
  arrow1: { url: "/models/gltf/Arrow_A.glb" },

  //MAPS
  prototypeMap: { url: "/models/gltf/PrototypeMap.glb" },
  CollisionMap_prototypeMap: { url: "/models/gltf/CollisionMap_PrototypeMap.glb" },
};