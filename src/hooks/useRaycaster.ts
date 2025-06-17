import { ClickableComponent } from "@/components/ClickableComponent";
import { UnitPlacementSystemHandle } from "@/components/UnitPlacementSystem";
import { GameObject } from "@/ecs/GameObject";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { RoundState } from "@/gameLogic/roundManager";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { Unit } from "@/units/Unit";
import RAPIER, { World } from "@dimforge/rapier3d";
import { useEffect } from "react";
import * as THREE from "three";
import { ThreeSceneRef } from "./useThreeScene";

export const useRaycaster = (
  threeScene: ThreeSceneRef | null,
  worldRef: React.RefObject<RAPIER.World | undefined>,
  gameObjectManager: React.RefObject<GameObjectManager | undefined>,
  roundState: RoundState,
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>
) => {
  useEffect(() => {
    //drag useEffect. should only be enabled in setup mode.
    if (roundState <= RoundState.Setup) return;
    const pointer = new THREE.Vector2();
    const pointerMove = new THREE.Vector2();
    var draggableGO: GameObject | null;

    function moveDraggleGO(
      event: MouseEvent,
      camera: THREE.Camera,
      draggableGO: GameObject
    ) {
      pointerMove.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerMove.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointerMove, camera);

      // Define a horizontal plane at y = 1 (or wherever your grid is)
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1);
      const intersectionPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        // Now this intersectionPoint is a real 3D position on the ground
        draggableGO.transform.position.set(
          intersectionPoint.x,
          intersectionPoint.y,
          intersectionPoint.z
        );
      }
    }

    function onClick(event: MouseEvent) {
      if (!worldRef.current) return;
      const physicsWorld = worldRef.current;

      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      if (draggableGO) {
        onUp(draggableGO);
        draggableGO = null;
      } else {
        const raycaster = new THREE.Raycaster();
        if (threeScene) {
          raycaster.setFromCamera(pointer, threeScene?.camera);
        }

        const origin = raycaster.ray.origin;
        const direction = raycaster.ray.direction;

        const rapierRay = new RAPIER.Ray(origin, direction);
        const hit = physicsWorld.castRay(rapierRay, 100, true);

        if (hit && hit.collider) {
          const colliderHandle = hit.collider.handle;
          const gameObject =
            gameObjectManager.current?.getGameObjectFromCollider(
              colliderHandle
            );

          if (gameObject) {
            const clickable = gameObject.getComponent(ClickableComponent);
            const unit = gameObject.getComponent(Unit);

            // Only allow dragging of player units (team 1)
            if (clickable && placementRef.current && unit?.teamId === 1) {
              draggableGO = gameObject;
              // moveDraggleGO is now called in onMove
            }
          }
        }
      }
    }
    function onMove(event: MouseEvent) {
      if (!draggableGO || !placementRef.current || !threeScene) return;
      moveDraggleGO(event, threeScene.camera, draggableGO);
    }

    function onUp(draggableGO: GameObject) {
      if (!placementRef.current) return;
      const draggableUnit = draggableGO.getComponent(Unit);
      const body = draggableGO.getComponent(CharacterRigidbody);

      if (!draggableUnit || !body) {
        console.log("Clickable was not a unit!");
        return;
      }

      const targetTile = placementRef.current.getGrid(
        draggableGO.transform.position
      );
      const oldTile = placementRef.current.getGrid(draggableUnit.gridPosition);

      // --- START: PLACEMENT VALIDATION LOGIC ---
      let isPlacementValid = false;
      if (targetTile) {
        const gridTiles = placementRef.current.getGridTiles();
        const totalRows = gridTiles.length;
        const midwayPoint = totalRows / 2;
        const unitTeamId = draggableUnit.teamId;

        // Player (Team 1) can only place on the bottom half of the board
        if (unitTeamId === 1 && targetTile.row < midwayPoint) {
          isPlacementValid = true;
        }
        // Enemy (Team 2) can only place on the top half
        else if (unitTeamId === 2 && targetTile.row >= midwayPoint) {
          isPlacementValid = true;
        }
      }

      if (!targetTile || !oldTile || !isPlacementValid) {
        if (targetTile && !isPlacementValid) {
          console.log(
            `Invalid placement for Team ${draggableUnit.teamId} at row ${targetTile.row}.`
          );
        }
        body.setPosition(draggableUnit.gridPosition);
        return; // Exit the function
      }
      // --- END: PLACEMENT VALIDATION LOGIC ---

      // --- The rest of the logic runs only if placement is valid ---

      // Case 1: Dropped on an UNOCCUPIED tile
      if (!targetTile.occupiedUnit) {
        placementRef.current.markOccupied(oldTile.row, oldTile.col, null);
        placementRef.current.markOccupied(
          targetTile.row,
          targetTile.col,
          draggableUnit
        );
        body.setPosition(targetTile.position);
        draggableUnit.gridPosition = targetTile.position.clone();
      }
      // Case 2: Dropped on an OCCUPIED tile (Swap)
      else if (
        targetTile.occupiedUnit &&
        targetTile.occupiedUnit !== draggableUnit
      ) {
        const otherUnit = targetTile.occupiedUnit;
        const otherUnitBody =
          otherUnit.gameObject.getComponent(CharacterRigidbody);

        if (otherUnitBody) {
          // Move the other unit to the dragged unit's original tile
          otherUnitBody.setPosition(oldTile.position);
          placementRef.current.markOccupied(
            oldTile.row,
            oldTile.col,
            otherUnit
          );
          otherUnit.gridPosition = oldTile.position.clone();

          // Move the dragged unit to the target tile
          body.setPosition(targetTile.position);
          placementRef.current.markOccupied(
            targetTile.row,
            targetTile.col,
            draggableUnit
          );
          draggableUnit.gridPosition = targetTile.position.clone();
        }
      }
      // Case 3: Dropped back on itself
      else {
        body.setPosition(draggableUnit.gridPosition);
      }
    }

    // Replace 'click' with mousedown and mouseup for better drag-drop feel
    const onMouseDown = (event: MouseEvent) => {
      onClick(event);
    };

    const onMouseUp = () => {
      if (draggableGO) {
        onUp(draggableGO);
        draggableGO = null;
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMove);
    };
  }, [worldRef, gameObjectManager, roundState, placementRef]);
};
