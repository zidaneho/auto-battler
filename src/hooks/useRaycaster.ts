import { ClickableComponent } from "@/components/ClickableComponent";
import { UnitPlacementSystemHandle } from "@/components/UnitPlacementSystem";
import { GameObject } from "@/ecs/GameObject";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { Unit } from "@/units/Unit";
import RAPIER, { World } from "@dimforge/rapier3d";
import { useEffect } from "react";
import * as THREE from "three";

export const useRaycaster = (
  threeRef: React.RefObject<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
  } | null>,
  worldRef: React.RefObject<RAPIER.World | null>,
  gameObjectManager: React.RefObject<GameObjectManager | null>,
  roundState: "setup" | "battle" | "end",
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>
) => {
  useEffect(() => {
    //drag useEffect. should only be enabled in setup mode.
    if (roundState !== "setup") return;
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

      // Define a horizontal plane at y = 0 (or wherever your ground is)
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        // Now this intersectionPoint is a real 3D position on the ground
        draggableGO.transform.position.set(
          intersectionPoint.x,
          intersectionPoint.y + 1,
          intersectionPoint.z
        );
      }
    }

    function onClick(event: MouseEvent) {
      if (!threeRef.current || !worldRef.current) return;
      const physicsWorld = worldRef.current;

      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      if (draggableGO) {
        console.log("calling on up");
        onUp(draggableGO);
        draggableGO = null;
      } else {
        const camera = threeRef.current.camera;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, camera);

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

            if (clickable && placementRef.current) {
              draggableGO = gameObject;
              console.log("hit " + gameObject.name);

              moveDraggleGO(event, camera, draggableGO);
            }
          }
        }
      }
    }
    function onMove(event: MouseEvent) {
      if (!threeRef.current || !draggableGO || !placementRef.current) return;

      const { camera, scene } = threeRef.current;

      moveDraggleGO(event, camera, draggableGO);
    }
    function onUp(draggableGO: GameObject) {
      if (!placementRef.current) return;
      const draggableUnit = draggableGO.getComponent(Unit);
      const body = draggableGO.getComponent(CharacterRigidbody);
      if (!draggableUnit) {
        console.log("clickable was not a unit!");
        return;
      }
      if (!body) {
        console.log("clickable was not a characterRigidbody!");
        return;
      }
      const tile = placementRef.current.getGrid(draggableGO.transform.position);
      if (tile && !tile.isOccupied) {
        console.log(`found a valid tile! at (${tile.row},${tile.col}})`);
        placementRef.current.markOccupied(tile.row, tile.col, true);
        body.setPosition(tile.position);
        draggableUnit.gridPosition = tile.position.clone();
      } else {
        console.log(
          `no valid grids. returning to (${draggableUnit.gridPosition.x},${draggableUnit.gridPosition.y},${draggableUnit.gridPosition.z}).`
        );
        body.setPosition(draggableUnit.gridPosition);
      }
      //if the unit is in a invalid spot, just set it back to its gridPosition.
    }

    window.addEventListener("click", onClick);
    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("mousemove", onMove);
    };
  }, [threeRef, worldRef, roundState, placementRef]);
};
