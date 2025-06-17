import { useEffect } from "react";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { GameObjectManager } from "../ecs/GameObjectManager";
import { UnitManager } from "../units/UnitManager";
import { ThreeSceneRef } from "./useThreeScene";
import { RoundState } from "@/gameLogic/roundManager";

// The hook now takes individual systems and state as parameters
export const useGameLoop = (
  threeRef: React.RefObject<ThreeSceneRef | undefined>,
  world: RAPIER.World | undefined,
  gameObjectManager: GameObjectManager | undefined,
  unitManager: UnitManager | undefined,
  isGameActive: boolean,
  roundState: RoundState
) => {
  useEffect(() => {
    // The check now verifies each individual system
    if (
      !threeRef.current ||
      !world ||
      !gameObjectManager ||
      !unitManager
    ) {
      return;
    }

    if (!isGameActive) return;

    const { scene, camera, renderer, controls } = threeRef.current;
    
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const delta = clock.getDelta();
      controls.update();

      if (isGameActive) {
        // Step the physics world
        world.step();
        
        // Update units only during the battle phase
        if (roundState === RoundState.Battle) {
          unitManager.update();
        }
        
        // Update all game objects
        gameObjectManager.update(delta);
      }
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [ // The dependency array is updated to reflect the new parameters
    threeRef,
    world,
    gameObjectManager,
    unitManager,
    isGameActive,
    roundState,
  ]);
};