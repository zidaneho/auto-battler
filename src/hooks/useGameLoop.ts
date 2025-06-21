import { useEffect } from "react";
import * as RAPIER from "@dimforge/rapier3d";
import { GameObjectManager } from "../ecs/GameObjectManager";
import { UnitManager } from "../units/UnitManager";
import { ThreeSceneRef } from "./useThreeScene";
import { RoundManager } from "@/gameLogic/roundManager";
import * as THREE from "three";

export const useGameLoop = (
  threeScene: ThreeSceneRef | null,
  world: RAPIER.World | undefined,
  gameObjectManager: GameObjectManager | undefined,
  unitManager: UnitManager | undefined,
  roundManager: RoundManager | null, // Pass the entire manager
  isGameActive: boolean,
  isOverlayActive: boolean
) => {
  useEffect(() => {
    // Exit if essential systems aren't ready or the game isn't active
    if (
      !threeScene ||
      !world ||
      !gameObjectManager ||
      !unitManager ||
      !roundManager ||
      !isGameActive
    ) {
      return;
    }

    const { scene, camera, renderer, controls } = threeScene;

    renderer.autoClear = false;

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const delta = clock.getDelta();
      const now = clock.getElapsedTime();

      renderer.clear();

      // 1. Update game logic managers
      roundManager.update(delta);
      unitManager.update(now);
      gameObjectManager.update(delta);

      // 2. Update camera controls
      controls.update();

      // 3. Render the scene
      renderer.render(scene, camera);

      // 4. Request the next frame to create the loop
      animationFrameId = requestAnimationFrame(render);
    };

    // Start the loop
    render();

    if (isOverlayActive) {
      renderer.clearDepth(); // Clear depth buffer to draw on top
      renderer.render(threeScene.overlayScene, threeScene.overlayCamera);
    }

    // Cleanup function to cancel the loop when the component unmounts
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    threeScene,
    world,
    gameObjectManager,
    unitManager,
    roundManager,
    isGameActive,
  ]);
};
