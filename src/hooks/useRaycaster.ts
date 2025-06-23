// src/hooks/useRaycaster.ts (Revised with better logging)

import { ClickableComponent } from "@/components/ClickableComponent";
import { UnitPlacementSystemHandle } from "@/units/UnitPlacementSystem";
import { GameObject } from "@/ecs/GameObject";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { RoundState } from "@/gameLogic/roundManager";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { Unit } from "@/units/Unit";
import RAPIER from "@dimforge/rapier3d";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ThreeSceneRef } from "./useThreeScene";

export const getNormalizedCoordinates = (
  canvas: HTMLCanvasElement,
  event: MouseEvent
): THREE.Vector2 => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  return new THREE.Vector2(
    (x / rect.width) * 2 - 1,
    -(y / rect.height) * 2 + 1
  );
};

export const useRaycaster = (
  threeScene: ThreeSceneRef | null,
  worldRef: React.RefObject<RAPIER.World | undefined>,
  gameObjectManager: React.RefObject<GameObjectManager | undefined>,
  roundState: RoundState,
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>
) => {
  const draggableGORef = useRef<GameObject | null>(null);

  useEffect(() => {
    if (roundState !== RoundState.Setup || !threeScene) return;

    const { camera, renderer } = threeScene;
    const canvas = renderer.domElement;

    const onMouseDown = (event: MouseEvent) => {
      if (!worldRef.current || !gameObjectManager.current) return;

      const pointer = getNormalizedCoordinates(canvas, event);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);

      const origin = raycaster.ray.origin;
      const direction = raycaster.ray.direction;
      const rapierRay = new RAPIER.Ray(origin, direction);

      const hit = worldRef.current.castRay(rapierRay, 100, true);

      if (hit?.collider) {
        const gameObject = gameObjectManager.current.getGameObjectFromCollider(
          hit.collider.handle
        );

        if (gameObject) {
          const clickable = gameObject.getComponent(ClickableComponent);
          const unit = gameObject.getComponent(Unit);
          if (clickable && unit?.teamId === 1) {
            draggableGORef.current = gameObject;
          }
        }
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!draggableGORef.current) return;

      const pointer = getNormalizedCoordinates(canvas, event);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1);
      const intersectionPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        draggableGORef.current.transform.position.copy(intersectionPoint);
      }
    };

    const onMouseUp = () => {
      const draggableGO = draggableGORef.current;
      if (!draggableGO || !placementRef.current) {
        draggableGORef.current = null;
        return;
      }

      const draggableUnit = draggableGO.getComponent(Unit);
      const body = draggableGO.getComponent(CharacterRigidbody);

      if (!draggableUnit || !body) {
        draggableGORef.current = null;
        return;
      }

      const targetTile = placementRef.current.getGrid(
        draggableGO.transform.position
      );
      const oldTile = placementRef.current.getGrid(draggableUnit.gridPosition);

      // --- START PLACEMENT VALIDATION ---
      let isPlacementValid = false;
      if (targetTile) {
        const gridTiles = placementRef.current.getGridTiles();
        const midwayPoint = gridTiles.length / 2;
        if (draggableUnit.teamId === 1 && targetTile.row < midwayPoint) {
          isPlacementValid = true;
        }
      }
      // --- END PLACEMENT VALIDATION ---

      // --- DECISION LOGIC ---

      if (!targetTile || !oldTile || !isPlacementValid) {
        console.log(
          "%c[DROP FAILED]: Invalid placement. Reverting.",
          "color: red;"
        );
        if (!targetTile) console.log("L-> Reason: Target tile is null.");
        if (!oldTile)
          console.log(
            "L-> Reason: Old tile is null (gridPosition might be corrupted)."
          );
        if (!isPlacementValid)
          console.log(
            `L-> Reason: Placement at row ${targetTile?.row} is not valid for team ${draggableUnit.teamId}.`
          );

        body.setPosition(draggableUnit.gridPosition);
      } else if (!targetTile.occupiedUnit) {
        console.log(
          `%c[DROP SUCCESS]: Moved to empty tile (${targetTile.row}, ${targetTile.col}).`,
          "color: green;"
        );

        placementRef.current.markOccupied(oldTile.row, oldTile.col, null);
        placementRef.current.markOccupied(
          targetTile.row,
          targetTile.col,
          draggableUnit
        );
        body.setPosition(targetTile.position);
        console.log(
          oldTile.toString(),
          targetTile.toString(),
          oldTile.position.toArray(),
          targetTile.position.toArray()
          //draggableUnit.gridPosition.toArray(),
        );
        draggableUnit.gridPosition.copy(targetTile.position);
      } else if (
        targetTile.occupiedUnit.gameObject.name !==
        draggableUnit.gameObject.name
      ) {
        console.log(
          `%c[DROP SUCCESS]: Swapping with ${targetTile.occupiedUnit.gameObject.name}.`,
          "color: blue;"
        );

        const otherUnit = targetTile.occupiedUnit;
        const otherUnitBody =
          otherUnit.gameObject.getComponent(CharacterRigidbody);

        if (otherUnitBody) {
          otherUnitBody.setPosition(oldTile.position);
          placementRef.current.markOccupied(
            oldTile.row,
            oldTile.col,
            otherUnit
          );
          otherUnit.gridPosition.copy(oldTile.position);

          body.setPosition(targetTile.position);
          placementRef.current.markOccupied(
            targetTile.row,
            targetTile.col,
            draggableUnit
          );
          draggableUnit.gridPosition.copy(targetTile.position);
        } else {
          console.log(
            "%c[SWAP FAILED]: Other unit has no rigidbody. Reverting.",
            "color: orange;"
          );
          body.setPosition(draggableUnit.gridPosition);
        }
      } else {
        console.log(
          "%c[DROP IGNORED]: Dropped on self. Reverting.",
          "color: yellow;"
        );
        body.setPosition(draggableUnit.gridPosition);
      }

      draggableGORef.current = null;
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [threeScene, worldRef, gameObjectManager, roundState, placementRef]);
};
