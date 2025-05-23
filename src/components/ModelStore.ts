// ModelStore.ts
import { create } from "zustand";
import * as THREE from "three";

export interface Model {
  gltf: THREE.Object3D;
  animations: Record<string, THREE.AnimationClip>;
  damagePoint1?: number;
}

export const useModelStore = create<{
  models: Record<string, Model>;
  setModel: (key: string, model: Model) => void;
  getModel: (key: string) => Model | undefined;
}>((set, get) => ({
  models: {},
  setModel: (key, model) =>
    set((state) => ({ models: { ...state.models, [key]: model } })),
  getModel: (key) => get().models[key],
}));
