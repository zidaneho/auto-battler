import { GLTF } from "three/examples/jsm/Addons";
import { AnimationClip } from "three";
import * as THREE from "three";

export interface ModelEntry {
  url: string;
  damagePoint1?: number;
}

export const models: Record<string, ModelEntry> = {
  //UNITS
  archer1: { url: "/models/gltf/TT_Archer.glb",damagePoint1:0.25 },
  knight1: { url: "/models/gltf/TT_Light_Infantry.glb",damagePoint1: 0.25 },
  mage1: {url:"/models/gltf/TT_Mage.glb"},
  worker1: {url:"/models/gltf/TT_Peasant.glb"},
  priest1: {url:"/models/gltf/TT_Priest.glb",damagePoint1:0.6},
  //PROJECTILES
  arrow1: {url:"/models/gltf/Arrow_A.glb"},
  //MAPS
  prototypeMap:{url:"/models/gltf/PrototypeMap.glb"},
  CollisionMap_prototypeMap:{url:"/models/gltf/CollisionMap_PrototypeMap.glb"}
};