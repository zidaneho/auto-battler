import { useEffect } from "react";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { useModelStore } from "../components/ModelStore"; // Adjust path
import { GameObjectManager } from "../ecs/GameObjectManager"; // Adjust path
import { StaticBody } from "../physics/StaticBody"; // Adjust path
import { BoxCollider } from "../physics/BoxCollider"; // Adjust path
import { DebugMesh } from "../components/meshes/DebugMesh"; // Adjust path
import { models as globalModelList } from "../components/meshes/ModelList"; // Adjust path

export const useMapManager = (
  threeRef: React.RefObject<{ scene: THREE.Scene } | undefined>,
  worldRef: React.RefObject<RAPIER.World | undefined>,
  gameObjectManagerRef: React.RefObject<GameObjectManager | undefined>,
  currentMap: keyof typeof globalModelList,
  isLoaded: boolean
) => {
  const mapModel = useModelStore((s) => s.models[currentMap]);
  const collisionMapModel = useModelStore(
    (s) =>
      s.models[("CollisionMap_" + currentMap) as keyof typeof globalModelList] // Cast for type safety
  );

  useEffect(() => {
    if (
      !threeRef.current?.scene ||
      !mapModel?.gltf ||
      !isLoaded ||
      !worldRef.current || // Added worldRef check
      !gameObjectManagerRef.current // Added gameObjectManagerRef check
    ) {
      return;
    }

    const scene = threeRef.current.scene;
    const world = worldRef.current;
    const gameObjectManager = gameObjectManagerRef.current;

    // Clear old map
    scene.children
      .filter((c) => c.userData.isMap)
      .forEach((c) => scene.remove(c));
    // Clear old collision GameObjects (assuming they are tagged or managed appropriately)
    // This part requires a robust way to identify and remove old collision objects.
    // For simplicity, if GameObjects are named 'CollisionPart_terrain', they could be found and removed.
    // Or, manage them in a dedicated array/group within GameObjectManager.

    const newMapInstance = mapModel.gltf.clone();
    newMapInstance.userData.isMap = true;
    scene.add(newMapInstance);

    if (collisionMapModel?.gltf) {
      const collisionMapInstance = collisionMapModel.gltf.clone();
      // Optionally add to scene for debugging, but primarily for physics
      // scene.add(collisionMapInstance); // Or make it invisible
      collisionMapInstance.position.copy(newMapInstance.position);
      collisionMapInstance.rotation.copy(newMapInstance.rotation);
      collisionMapInstance.scale.copy(newMapInstance.scale);

      collisionMapInstance.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Process only meshes for colliders
          const gameObject = gameObjectManager.createGameObject(
            child, // Pass the child mesh itself, or create a new empty transform
            "CollisionPart",
            "terrain"
          );

          if (!gameObject) return;

          // Match transform of the child mesh
          const worldPosition = new THREE.Vector3();
          child.getWorldPosition(worldPosition);
          gameObject.setPosition(worldPosition);

          const worldQuaternion = new THREE.Quaternion();
          child.getWorldQuaternion(worldQuaternion);
          gameObject.transform.setRotationFromQuaternion(worldQuaternion);

          const worldScale = new THREE.Vector3();
          child.getWorldScale(worldScale);
          // gameObject.transform.scale.copy(worldScale); // GameObject scale is usually 1,1,1 unless specified

          // Use world-scale size for the collider, relative to the child's own scale if it has geometry
          // If the child is just a transform node, and geometry is deeper, this logic needs adjustment
          // Assuming child itself has geometry or represents the collision volume
          const collider = gameObject.addComponent(
            BoxCollider,
            child.geometry
              ? (child.geometry.boundingBox?.getSize(new THREE.Vector3()).x ??
                  1) * worldScale.x
              : worldScale.x,
            child.geometry
              ? (child.geometry.boundingBox?.getSize(new THREE.Vector3()).y ??
                  1) * worldScale.y
              : worldScale.y,
            child.geometry
              ? (child.geometry.boundingBox?.getSize(new THREE.Vector3()).z ??
                  1) * worldScale.z
              : worldScale.z
          );

          // If collider.description is undefined, it means BoxCollider construction failed or returned nothing.
          if (collider && collider.description) {
            const body = gameObject.addComponent(
              StaticBody,
              world,
              collider.description
            );
            // gameObject.addComponent(DebugMesh, body, scene); // Optional: For debugging colliders
          } else {
            console.warn(
              "Failed to create collider description for a collision part.",
              child
            );
          }
        }
      });
      console.log("Collision map processed for:", currentMap);
    }
    console.log(`Map loaded: ${currentMap}`);
  }, [
    threeRef,
    worldRef,
    gameObjectManagerRef,
    mapModel,
    collisionMapModel, // Added dependency
    currentMap,
    isLoaded,
  ]);
};
