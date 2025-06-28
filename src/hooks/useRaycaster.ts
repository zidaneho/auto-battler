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
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>,
  selectedUnit: Unit | null, // NEW: currently selected unit
  onUnitSelect: (unit: Unit | null) => void // NEW: selection handler
) => {
  const draggableGORef = useRef<GameObject | null>(null);
  const isDraggingRef = useRef(false);
  const mouseDownPos = useRef<THREE.Vector2 | null>(null);

  useEffect(() => {
    if (!threeScene) return;

    const { camera, renderer } = threeScene;
    const canvas = renderer.domElement;

    const onMouseDown = (event: MouseEvent) => {
      isDraggingRef.current = false;
      mouseDownPos.current = new THREE.Vector2(event.clientX, event.clientY);

      // Only allow drag-and-drop in setup phase
      if (
        !(
          roundState === RoundState.Setup ||
          roundState === RoundState.InitialShop
        )
      )
        return;

      if (!worldRef.current || !gameObjectManager.current) return;

      const pointer = getNormalizedCoordinates(canvas, event);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const rapierRay = new RAPIER.Ray(
        raycaster.ray.origin,
        raycaster.ray.direction
      );
      const hit = worldRef.current.castRay(rapierRay, 100, true);

      if (hit?.collider) {
        const go = gameObjectManager.current.getGameObjectFromCollider(
          hit.collider.handle
        );
        if (go) {
          const clickable = go.getComponent(ClickableComponent);
          const unit = go.getComponent(Unit);
          // Can only drag your own units
          if (clickable && unit?.teamId === 1) {
            draggableGORef.current = go;
          }
        }
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!draggableGORef.current) return;

      // Check if mouse has moved significantly to be considered a drag
      if (
        mouseDownPos.current &&
        new THREE.Vector2(event.clientX, event.clientY).distanceTo(
          mouseDownPos.current
        ) > 5
      ) {
        isDraggingRef.current = true;
      }

      if (!isDraggingRef.current) return;

      // If dragging, also deselect any unit to avoid confusion
      if (selectedUnit) onUnitSelect(null);

      const pointer = getNormalizedCoordinates(canvas, event);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1);
      const intersectionPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        draggableGORef.current.transform.position.copy(intersectionPoint);
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      // If we were dragging, execute placement logic
      if (isDraggingRef.current && draggableGORef.current) {
        const draggableGO = draggableGORef.current;
        const draggableUnit = draggableGO.getComponent(Unit);
        const body = draggableGO.getComponent(CharacterRigidbody);

        if (draggableUnit && body && placementRef.current) {
          // ... (existing drag-and-drop placement logic)
          const targetTile = placementRef.current.getGrid(
            draggableGO.transform.position
          );
          const oldTile = placementRef.current.getGrid(
            draggableUnit.gridPosition
          );
          const gridTiles = placementRef.current.getGridTiles();
          const midwayPoint = gridTiles.length / 2;
          let isPlacementValid = targetTile
            ? targetTile.row < midwayPoint
            : false;

          if (!targetTile || !oldTile || !isPlacementValid) {
            body.setPosition(draggableUnit.gridPosition);
          } else if (!targetTile.occupiedUnit) {
            placementRef.current.markOccupied(oldTile.row, oldTile.col, null);
            placementRef.current.markOccupied(
              targetTile.row,
              targetTile.col,
              draggableUnit
            );
            body.setPosition(targetTile.position);
            draggableUnit.gridPosition.copy(targetTile.position);
          } else if (
            targetTile.occupiedUnit.gameObject.name !==
            draggableUnit.gameObject.name
          ) {
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
            }
          } else {
            body.setPosition(draggableUnit.gridPosition);
          }
        }
      } else {
        // --- THIS IS A CLICK, NOT A DRAG ---
        handleClick(event);
      }

      // Reset dragging state
      draggableGORef.current = null;
      isDraggingRef.current = false;
      mouseDownPos.current = null;
    };

    const handleClick = (event: MouseEvent) => {
      if (!worldRef.current || !gameObjectManager.current) return;

      const pointer = getNormalizedCoordinates(canvas, event);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const rapierRay = new RAPIER.Ray(
        raycaster.ray.origin,
        raycaster.ray.direction
      );
      const hit = worldRef.current.castRay(rapierRay, 100, true);

      const hitGo = hit
        ? gameObjectManager.current.getGameObjectFromCollider(
            hit.collider.handle
          )
        : null;
      const hitUnit = hitGo?.getComponent(Unit);

      // --- Logic for Setup Phase (Click-to-Move) ---
      if (
        roundState === RoundState.Setup ||
        roundState === RoundState.InitialShop
      ) {
        // --- MODIFIED ---
        // Ensure we hit a valid object that is NOT a unit before attempting to move
        if (selectedUnit && hitGo && hitGo.tag !== "unit") {
          const targetTile = placementRef.current?.getGrid(
            hitGo.transform.position // No longer using '!' because we know hitGo is not null
          );
          const midwayPoint = placementRef.current!.getGridTiles().length / 2;

          if (
            targetTile &&
            !targetTile.occupiedUnit &&
            targetTile.row < midwayPoint
          ) {
            // Move the selected unit to the clicked empty tile
            const oldTile = placementRef.current!.getGrid(
              selectedUnit.gridPosition
            );
            if (oldTile)
              placementRef.current!.markOccupied(
                oldTile.row,
                oldTile.col,
                null
              );

            placementRef.current!.markOccupied(
              targetTile.row,
              targetTile.col,
              selectedUnit
            );
            selectedUnit.rigidbody?.setPosition(targetTile.position);
            selectedUnit.gridPosition.copy(targetTile.position);
            onUnitSelect(null); // Deselect after moving
          } else {
            onUnitSelect(null); // Deselect if clicking invalid tile
          }
          return;
        }
      }

      // --- Generic Click-to-Select Logic for all phases ---
      if (hitUnit) {
        if (selectedUnit === hitUnit) {
          onUnitSelect(null); // Deselect if clicking the same unit
        } else {
          onUnitSelect(hitUnit); // Select the new unit
        }
      } else {
        onUnitSelect(null); // Deselect if clicking on nothing
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    threeScene,
    worldRef,
    gameObjectManager,
    roundState,
    placementRef,
    selectedUnit,
    onUnitSelect,
  ]);
};
