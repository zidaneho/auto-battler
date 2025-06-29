// src/hooks/usePhysicsWorld.ts

import { useEffect, useRef } from "react";
import * as RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { GameObjectManager } from "../ecs/GameObjectManager"; // Adjust path
import { UnitManager } from "../units/UnitManager"; // Adjust path
import { ProjectileManager } from "../projectiles/ProjectileManager"; // Adjust path
import { RoundManager } from "@/gameLogic/roundManager";
import { ThreeSceneRef } from "./useThreeScene";
import { VFXManager } from "@/particles/VFXManager";

export const usePhysicsWorld = (
  sceneRef: ThreeSceneRef | null, // Depends on scene for ProjectileManager
  isLoaded: boolean // Ensure it runs after initial assets/scene might be ready
) => {
  const worldRef = useRef<RAPIER.World | undefined>(undefined);
  const gameObjectManagerRef = useRef<GameObjectManager | undefined>(undefined);
  const unitManagerRef = useRef<UnitManager | undefined>(undefined);
  const projectileManagerRef = useRef<ProjectileManager | undefined>(undefined);
  const vfxManagerRef = useRef<VFXManager | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded || sceneRef == null) return; // Basic gate

    if (!worldRef.current && sceneRef) {
      // Ensure scene is available for ProjectileManager
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      const world = new RAPIER.World(gravity);
      
      // Set a fixed timestep for the physics world (e.g., 60 physics steps per second)
      world.integrationParameters.dt = 1.0 / 60.0;
      
      worldRef.current = world;

      

      const goManager = new GameObjectManager(world);
      gameObjectManagerRef.current = goManager;

      const vfxManager = new VFXManager(goManager, sceneRef.scene);
      vfxManagerRef.current = vfxManager;

      unitManagerRef.current = new UnitManager(goManager);

      projectileManagerRef.current = new ProjectileManager(
        goManager,
        vfxManager,
        sceneRef.scene, // Pass the actual scene object
        world
      );

      console.log("Physics world and managers initialized.");
    }

    return () => {
      // Cleanup physics world and managers if necessary upon unmount or dependency change
      // worldRef.current?.free(); // Rapier world cleanup
      worldRef.current = undefined;
      gameObjectManagerRef.current = undefined;
      unitManagerRef.current = undefined;
      projectileManagerRef.current = undefined;
      vfxManagerRef.current = undefined;
    };
  }, [isLoaded, sceneRef]); // Re-run if isLoaded or sceneRef changes

  return {
    worldRef,
    gameObjectManagerRef,
    unitManagerRef,
    projectileManagerRef,
    vfxManagerRef
  };
};