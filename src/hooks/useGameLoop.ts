import { useEffect } from "react";
import * as RAPIER from "@dimforge/rapier3d";
import { GameObjectManager } from "../ecs/GameObjectManager";
import { UnitManager } from "../units/UnitManager";
import { ThreeSceneRef } from "./useThreeScene";
import { RoundState } from "@/gameLogic/roundManager";
import * as THREE from "three";

export const useGameLoop = (
  threeScene: ThreeSceneRef | null, // Changed from threeRef
  world: RAPIER.World | undefined,
  gameObjectManager: GameObjectManager | undefined,
  unitManager: UnitManager | undefined,
  isGameActive: boolean,
  roundState: RoundState
) => {
  useEffect(() => {
    // Check for threeScene
    if (
      !threeScene ||
      !world ||
      !gameObjectManager ||
      !unitManager
    ) {
      return;
    }
    
    if (!isGameActive) return;

    const { scene, camera, renderer, controls } = threeScene; // Destructure here
    
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
        // ... (rest of the render function is the same)
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [
    threeScene, // Dependency changed to threeScene
    world,
    gameObjectManager,
    unitManager,
    isGameActive,
    roundState,
  ]);
};