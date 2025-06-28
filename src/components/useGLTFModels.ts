// utils/loadGLTFModels.ts
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { models } from "@/components/meshes/ModelList";
import { useModelStore } from "@/components/ModelStore";

export function loadGLTFModels(onComplete: () => void) {
  const loadingManager = new THREE.LoadingManager();
  loadingManager.onLoad = onComplete;

  const loader = new GLTFLoader(loadingManager);
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/examples/jsm/libs/draco/");
  loader.setDRACOLoader(dracoLoader);

  const setModel = useModelStore.getState().setModel;

  Object.entries(models).forEach(([key, model]) => {
    loader.load(
      model.url,
      (gltf) => {
        const anims: Record<string, THREE.AnimationClip> = {};
        gltf.animations.forEach((clip) => {
          const match = clip.name.match(/^(?:[^_]+_){2}(.+)$/);
          if (match) clip.name = match[1];
          anims[clip.name] = clip;
        });

        setModel(key, {
          gltf: gltf.scene,
          animations: anims,
          damagePoint1: model.damagePoint1,
        });

        // ---v--- ADDED LOGGING START ---v---

        console.log(
          `%c[Model Loaded]: ${key}`,
          "color: #4CAF50; font-weight: bold;"
        );

        const animationNames = Object.keys(anims);
        if (animationNames.length > 0) {
          console.log("  Animations:", animationNames);
        } else {
          console.log("  No animations found for this model.");
        }

        // ---^--- ADDED LOGGING END ---^---
      },
      undefined,
      (err) => console.error(`Failed to load ${model.url}`, err)
    );
  });
}
