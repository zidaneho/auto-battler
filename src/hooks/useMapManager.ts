import { useEffect } from "react";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { useModelStore } from "../components/ModelStore";
import { GameObjectManager } from "../ecs/GameObjectManager";
import { StaticBody } from "../physics/StaticBody";
import { BoxCollider } from "../physics/BoxCollider";
import { models as globalModelList } from "../components/meshes/ModelList";
import { ThreeSceneRef } from "./useThreeScene"; // Assuming ThreeSceneRef is exported

export const useMapManager = (
  threeScene: ThreeSceneRef | null, // Changed from threeRef
  worldRef: React.RefObject<RAPIER.World | undefined>,
  gameObjectManagerRef: React.RefObject<GameObjectManager | undefined>,
  currentMap: keyof typeof globalModelList,
  isLoaded: boolean
) => {
  const mapModel = useModelStore((s) => s.models[currentMap]);
  const collisionMapModel = useModelStore(
    (s) => s.models[("CollisionMap_" + currentMap) as keyof typeof globalModelList]
  );

  useEffect(() => {
    // Check for threeScene and its scene property
    if (
      !threeScene?.scene ||
      !mapModel?.gltf ||
      !isLoaded ||
      !worldRef.current ||
      !gameObjectManagerRef.current
    ) {
      return;
    }

    const scene = threeScene.scene;
    // ... rest of the hook is the same
  }, [
    threeScene, // Dependency changed to threeScene
    worldRef,
    gameObjectManagerRef,
    mapModel,
    collisionMapModel,
    currentMap,
    isLoaded,
  ]);
};