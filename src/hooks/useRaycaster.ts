// src/hooks/useRaycaster.ts

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

    // --- Helper to get corrected mouse coordinates ---
    const getNormalizedCoordinates = (event: MouseEvent): THREE.Vector2 => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      return new THREE.Vector2(
        (x / rect.width) * 2 - 1,
        -(y / rect.height) * 2 + 1
      );
    };

    const onMouseDown = (event: MouseEvent) => {
      console.log("onMouseDown triggered");
      if (!worldRef.current || !gameObjectManager.current) {
        console.log("World or GameObjectManager not available");
        return;
      }

      const pointer = getNormalizedCoordinates(event);
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
          console.log("Ray hit GameObject:", gameObject.name);
          const clickable = gameObject.getComponent(ClickableComponent);
          const unit = gameObject.getComponent(Unit);
          if (clickable && unit?.teamId === 1) {
            // Only drag player units
            draggableGORef.current = gameObject;
            console.log("Set draggable GameObject:", gameObject.name);
          } else {
            console.log("GameObject is not a draggable player unit.");
          }
        }
      } else {
        console.log("Ray did not hit any colliders.");
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!draggableGORef.current) return;

      const pointer = getNormalizedCoordinates(event);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1);
      const intersectionPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        // console.log(
        //   `Dragging ${
        //     draggableGORef.current.name
        //   } to position: x=${intersectionPoint.x.toFixed(
        //     2
        //   )}, y=${intersectionPoint.y.toFixed(
        //     2
        //   )}, z=${intersectionPoint.z.toFixed(2)}`
        // );
        draggableGORef.current.transform.position.copy(intersectionPoint);
      }
    };

    const onMouseUp = () => {
      const draggableGO = draggableGORef.current;
      if (!draggableGO) {
        // This case is for when the mouse is released without a draggable object, which is normal.
        // No log is needed here unless for intense debugging.
        return;
      }

      console.log("onMouseUp triggered for:", draggableGO.name);
      if (!placementRef.current) {
        console.error("Placement system reference is not available.");
        draggableGORef.current = null;
        return;
      }

      const draggableUnit = draggableGO.getComponent(Unit);
      const body = draggableGO.getComponent(CharacterRigidbody);

      if (!draggableUnit || !body) {
        console.log("Draggable object is missing Unit or Rigidbody component.");
        draggableGORef.current = null;
        return;
      }

      const targetTile = placementRef.current.getGrid(
        draggableGO.transform.position
      );
      const oldTile = placementRef.current.getGrid(draggableUnit.gridPosition);

      let isPlacementValid = false;
      if (targetTile) {
        const gridTiles = placementRef.current.getGridTiles();
        const midwayPoint = gridTiles.length / 2;
        if (draggableUnit.teamId === 1 && targetTile.row < midwayPoint) {
          isPlacementValid = true;
        }
      }

      if (!targetTile || !oldTile || !isPlacementValid) {
        console.log(
          "Invalid placement: No valid target tile or out of bounds. Reverting position."
        );
        body.setPosition(draggableUnit.gridPosition);
      } else if (!targetTile.occupiedUnit) {
        console.log(
          `Drop on empty tile: Moving ${draggableUnit.gameObject.name} from (${oldTile.row}, ${oldTile.col}) to (${targetTile.row}, ${targetTile.col}).`
        );
        // Drop on empty tile
        placementRef.current.markOccupied(oldTile.row, oldTile.col, null);
        placementRef.current.markOccupied(
          targetTile.row,
          targetTile.col,
          draggableUnit
        );
        body.setPosition(targetTile.position);
        draggableUnit.gridPosition.copy(targetTile.position);
      } else if (
        targetTile.occupiedUnit &&
        targetTile.occupiedUnit !== draggableUnit
      ) {
        console.log(
          `Swap with another unit: Swapping ${
            draggableUnit.gameObject.name
          } with ${
            targetTile.occupiedUnit.gameObject.name
          }, unit goes from ${oldTile.position.toArray()} to ${targetTile.position.toArray()}.`
        );
        // Swap with another unit
        const otherUnit = targetTile.occupiedUnit;
        const otherUnitBody =
          otherUnit.gameObject.getComponent(CharacterRigidbody);

        if (otherUnitBody) {
          // Move the other unit to the old tile
          otherUnitBody.setPosition(oldTile.position);
          placementRef.current.markOccupied(
            oldTile.row,
            oldTile.col,
            otherUnit
          );
          otherUnit.gridPosition.copy(oldTile.position);

          // Move the dragged unit to the target tile
          body.setPosition(targetTile.position);
          placementRef.current.markOccupied(
            targetTile.row,
            targetTile.col,
            draggableUnit
          );
          draggableUnit.gridPosition.copy(targetTile.position);
        } else {
          console.error(
            "Could not swap: The other unit is missing a CharacterRigidbody."
          );
        }
      } else {
        console.log("Dropped back on itself: Reverting to original position.");
        // Dropped back on itself
        body.setPosition(draggableUnit.gridPosition);
      }

      console.log("Finished onMouseUp logic. Clearing draggable GameObject.");
      draggableGORef.current = null;
    };

    console.log("Setting up raycaster event listeners for setup phase.");
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      console.log("Cleaning up raycaster event listeners.");
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [threeScene, worldRef, gameObjectManager, roundState, placementRef]);
};
