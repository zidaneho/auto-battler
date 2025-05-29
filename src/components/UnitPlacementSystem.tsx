import RAPIER from "@dimforge/rapier3d";
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as THREE from "three";
import { UnitManager } from "@/units/UnitManager";
import { GameObjectManager } from "../ecs/GameObjectManager";
import { CharacterRigidbody } from "../physics/CharacterRigidbody";
import { Knight } from "@/units/Knight";
import { useModelStore } from "./ModelStore";

interface Props {
  scene: THREE.Scene;
  position: THREE.Vector3;
  gridSize?: number;
  tileSize?: number;
}


export function getMaxUnits(grid: THREE.Vector3[][]): number {
  return grid[0].length * (grid.length / 2);
}
export interface UnitPlacementSystemHandle {
  getGridPositions: () => THREE.Vector3[][];
  getTileSize: () => number;
}

export const UnitPlacementSystem = forwardRef<UnitPlacementSystemHandle, Props>(
  ({ scene, position, gridSize = 5, tileSize = 1 }, ref) => {
    const gridRef = useRef<THREE.Group | null>(null);
    const gridPositionsRef = useRef<THREE.Vector3[][]>([]);

    useImperativeHandle(ref, () => ({
      getGridPositions: () => gridPositionsRef.current,
      getTileSize: () => tileSize,
    }));

    useEffect(() => {
      if (!scene) return;

      const gridGroup = new THREE.Group();
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });

      const positions: THREE.Vector3[][] = [];

      for (let x = 0; x < gridSize; x++) {
        const row: THREE.Vector3[] = [];

        for (let z = 0; z < gridSize; z++) {
          const worldX = x * tileSize + tileSize / 2;
          const worldZ = z * tileSize + tileSize / 2;

          const squareGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-tileSize / 2, 0, -tileSize / 2),
            new THREE.Vector3(tileSize / 2, 0, -tileSize / 2),
            new THREE.Vector3(tileSize / 2, 0, tileSize / 2),
            new THREE.Vector3(-tileSize / 2, 0, tileSize / 2),
            new THREE.Vector3(-tileSize / 2, 0, -tileSize / 2), // close loop
          ]);

          const line = new THREE.Line(squareGeometry, material);
          line.position.set(worldX - gridSize, 0.01, worldZ);

          gridGroup.add(line);

          const gridPos = line.position.clone().add(position);
          row.push(gridPos);
        }

        positions.push(row);
      }

      gridPositionsRef.current = positions;
      gridGroup.position.set(position.x, position.y, position.z);
      scene.add(gridGroup);
      gridRef.current = gridGroup;

      return () => {
        scene.remove(gridGroup);
      };
    }, [scene, position, gridSize, tileSize]);

    return null;
  }
);

export default UnitPlacementSystem;
