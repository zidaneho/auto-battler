// src/hooks/useGameLoop.ts

import { useEffect } from "react";
import * as RAPIER from "@dimforge/rapier3d";
import { GameObjectManager } from "../ecs/GameObjectManager";
import { UnitManager } from "../units/UnitManager";
import { ThreeSceneRef } from "./useThreeScene";
import { RoundManager } from "@/gameLogic/roundManager";
import * as THREE from "three";
import { CollisionComponent } from "@/physics/CollisionComponent";

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

    // --- Fixed-step physics variables ---
    let accumulator = 0;
    const physicsTimestep = world.integrationParameters.dt;
    const eventQueue = gameObjectManager.getEventQueue();
    // ---

    const render = () => {
      const delta = clock.getDelta();
      accumulator += delta;

      // 1. Step the physics world in fixed increments
      while (accumulator >= physicsTimestep) {
        world.step(eventQueue);
        accumulator -= physicsTimestep;
      }

      // 2. Handle collision events after stepping
      gameObjectManager.handleCollisions();

      // 3. Update other game logic with variable delta
      const now = clock.getElapsedTime();
      roundManager.update(delta);
      unitManager.update(now);
      gameObjectManager.update(delta); // No longer steps physics

      // 4. Update camera controls
      controls.update();

      // 5. Render the scene
      renderer.clear();
      renderer.render(scene, camera);

      if (isOverlayActive) {
        renderer.clearDepth(); // Clear depth buffer to draw on top
        renderer.render(threeScene.overlayScene, threeScene.overlayCamera);
      }

      // 6. Request the next frame to create the loop
      animationFrameId = requestAnimationFrame(render);
    };

    // Start the loop
    render();

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
    isOverlayActive,
  ]);
};