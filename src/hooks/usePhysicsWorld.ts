import { useEffect, useRef } from "react";
import * as RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { GameObjectManager } from "../ecs/GameObjectManager"; // Adjust path
import { UnitManager } from "../units/UnitManager"; // Adjust path
import { ProjectileManager } from "../projectiles/ProjectileManager"; // Adjust path
import { RoundManager } from "@/gameLogic/roundManager";

export const usePhysicsWorld = (
  sceneRef: React.RefObject<THREE.Scene | undefined>, // Depends on scene for ProjectileManager
  isLoaded: boolean // Ensure it runs after initial assets/scene might be ready
) => {
  const worldRef = useRef<RAPIER.World | undefined>(undefined);
  const gameObjectManagerRef = useRef<GameObjectManager | undefined>(undefined);
  const unitManagerRef = useRef<UnitManager | undefined>(undefined);
  const projectileManagerRef = useRef<ProjectileManager | undefined>(undefined);
  const roundManagerRef = useRef<RoundManager | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return; // Basic gate

    if (!worldRef.current && sceneRef.current) {
      // Ensure scene is available for ProjectileManager
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      const world = new RAPIER.World(gravity);
      worldRef.current = world;

      const goManager = new GameObjectManager(world);
      gameObjectManagerRef.current = goManager;

      unitManagerRef.current = new UnitManager(goManager);

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
      worldRef.current = undefined;
      gameObjectManagerRef.current =undefined;
      unitManagerRef.current = undefined;
      projectileManagerRef.current = undefined;
    };
  }, [isLoaded, sceneRef]); // Re-run if isLoaded or sceneRef changes

  return {
    worldRef,
    gameObjectManagerRef,
    unitManagerRef,
    projectileManagerRef,
  };
};
