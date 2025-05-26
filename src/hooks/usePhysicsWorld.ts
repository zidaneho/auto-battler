import { useEffect, useRef } from "react";
import * as RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { GameObjectManager } from "../ecs/GameObjectManager"; // Adjust path
import { UnitManager } from "../units/UnitManager"; // Adjust path
import { ProjectileManager } from "../projectiles/ProjectileManager"; // Adjust path

export const usePhysicsWorld = (
  sceneRef: React.RefObject<THREE.Scene | null>, // Depends on scene for ProjectileManager
  isLoaded: boolean // Ensure it runs after initial assets/scene might be ready
) => {
  const worldRef = useRef<RAPIER.World | null>(null);
  const gameObjectManagerRef = useRef<GameObjectManager | null>(null);
  const unitManagerRef = useRef<UnitManager | null>(null);
  const projectileManagerRef = useRef<ProjectileManager | null>(null);

  useEffect(() => {
    if (!isLoaded) return; // Basic gate

    if (!worldRef.current && sceneRef.current) {
      // Ensure scene is available for ProjectileManager
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      const world = new RAPIER.World(gravity);
      worldRef.current = world;

      const goManager = new GameObjectManager(world);
      gameObjectManagerRef.current = goManager;

      unitManagerRef.current = new UnitManager();

      projectileManagerRef.current = new ProjectileManager(
        goManager,
        sceneRef.current, // Pass the actual scene object
        world
      );
      console.log("Physics world and managers initialized.");
    }

    return () => {
      // Cleanup physics world and managers if necessary upon unmount or dependency change
      // worldRef.current?.free(); // Rapier world cleanup
      worldRef.current = null;
      gameObjectManagerRef.current = null;
      unitManagerRef.current = null;
      projectileManagerRef.current = null;
    };
  }, [isLoaded, sceneRef]); // Re-run if isLoaded or sceneRef changes

  return {
    worldRef,
    gameObjectManagerRef,
    unitManagerRef,
    projectileManagerRef,
  };
};
