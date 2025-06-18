import { useEffect } from "react";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { useModelStore } from "../components/ModelStore";
import { GameObjectManager } from "../ecs/GameObjectManager";
import { StaticBody } from "../physics/StaticBody";
import { BoxCollider } from "../physics/BoxCollider";
import { models as globalModelList } from "../components/meshes/ModelList";
import { ThreeSceneRef } from "./useThreeScene";

export const useMapManager = (
  threeScene: ThreeSceneRef | null,
  worldRef: React.RefObject<RAPIER.World | undefined>,
  gameObjectManagerRef: React.RefObject<GameObjectManager | undefined>,
  currentMap: keyof typeof globalModelList,
  isLoaded: boolean
) => {
  const mapModel = useModelStore((s) => s.models[currentMap]);
  const collisionMapModel = useModelStore(
    (s) =>
      s.models[("CollisionMap_" + currentMap) as keyof typeof globalModelList]
  );

  useEffect(() => {
    // 1. Check if all required objects are available.
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
    const world = worldRef.current;
    const gameObjectManager = gameObjectManagerRef.current;

    // 2. Add the visible map model to the scene.
    scene.add(mapModel.gltf);

    // 3. Process the collision map to create physics bodies.
    const collisionObjects: THREE.Object3D[] = [];
    if (collisionMapModel?.gltf) {
      collisionMapModel.gltf.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Make the collision mesh itself invisible
          child.visible = false;

          const gameObject = gameObjectManager.createGameObject(
            scene,
            `collision_${child.name}`,
            "terrain"
          );

          // Use the mesh's world position, rotation, and scale
          child.getWorldPosition(gameObject.transform.position);
          child.getWorldQuaternion(gameObject.transform.quaternion);
          gameObject.transform.scale.copy(child.scale);

          const size = new THREE.Vector3();
          new THREE.Box3().setFromObject(child).getSize(size);

          // Scale the collider size by the object's scale
          size.multiply(child.scale);

          const colliderDesc = new BoxCollider(
            gameObject,
            size.x,
            size.y,
            size.z
          ).description;

          gameObject.addComponent(StaticBody, world, colliderDesc);
          collisionObjects.push(gameObject.transform);
        }
      });
      scene.add(collisionMapModel.gltf);
    }

    // 4. Cleanup function to remove the map when dependencies change.
    return () => {
      if (mapModel?.gltf) {
        scene.remove(mapModel.gltf);
      }
      if (collisionMapModel?.gltf) {
        scene.remove(collisionMapModel.gltf);
      }
      // You might also want to remove the created game objects for colliders
      // from the gameObjectManager here if you have a robust removal system.
    };
  }, [
    threeScene,
    worldRef,
    gameObjectManagerRef,
    mapModel,
    collisionMapModel,
    currentMap,
    isLoaded,
  ]);
};
