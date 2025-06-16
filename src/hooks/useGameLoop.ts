import { useEffect } from "react";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GameObjectManager } from "../ecs/GameObjectManager"; // Adjust path
import { UnitManager } from "../units/UnitManager"; // Adjust path

export const useGameLoop = (
  threeRef: React.RefObject<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
  } | undefined>,
  worldRef: React.RefObject<RAPIER.World | undefined>,
  gameObjectManagerRef: React.RefObject<GameObjectManager | undefined>,
  unitManagerRef: React.RefObject<UnitManager | undefined>,
  isGameActive: boolean,
  roundState: "setup" | "battle" | "end"
) => {
  useEffect(() => {
    if (
      !threeRef.current ||
      !worldRef.current ||
      !gameObjectManagerRef.current ||
      !unitManagerRef.current
    ) {
      return;
    }

    if (!isGameActive && roundState !== "setup") return;

    const { scene, camera, renderer } = threeRef.current;
    const world = worldRef.current;
    const gameObjectManager = gameObjectManagerRef.current;
    const unitManager = unitManagerRef.current;
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const delta = clock.getDelta();
      if (isGameActive) {
        world.step();
        gameObjectManager.update(delta);
        if (roundState === "battle") {
          unitManager.update();
        }
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [
    threeRef,
    worldRef,
    gameObjectManagerRef,
    unitManagerRef,
    isGameActive,
    roundState,
  ]);
};
