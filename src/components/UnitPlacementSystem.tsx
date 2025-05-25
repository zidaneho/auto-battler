import RAPIER from "@dimforge/rapier3d";
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as THREE from "three";
import { UnitManager } from "./units/UnitManager";
import { GameObjectManager } from "./ecs/GameObjectManager";
import { CharacterRigidbody } from "./physics/CharacterRigidbody";
import { Knight } from "./units/Knight";
import { useModelStore } from "./ModelStore";

interface Props {
  scene: THREE.Scene;
  gridSize?: number;
  tileSize?: number;
  playerId: number;
}

export const fillUnitOnGrid = ({
  unitType,
  playerId,
  scene,
  world,
  unitManager,
  gameObjectManager,
  gridPositions,
}: {
  unitType: "knight1" | "priest1" | "archer1";
  playerId: number;
  scene: THREE.Scene;
  world: RAPIER.World;
  unitManager: UnitManager;
  gameObjectManager: GameObjectManager;
  gridPositions: THREE.Vector3[][];
}) => {
    
  const model = useModelStore.getState().models[unitType];
  if (!model || !model.gltf) {
    console.warn(`Model for ${unitType} not loaded`);
    return;
  }

  const offset = new THREE.Vector3(0, 0.8, 0);
  const colliderSize = new THREE.Vector3(0.4, 1.5, 0.4);

  for (let x = 0; x < gridPositions.length; x++) {
    for (let z = 0; z < gridPositions[x].length; z++) {
      const pos = gridPositions[x][z];
      const unit = unitManager.createUnit(
        Knight,
        pos,
        gameObjectManager,
        scene,
        unitType,
        model,
        world,
        offset,
        colliderSize,
        playerId
      );

      unit?.getComponent(CharacterRigidbody)?.setPosition(pos.clone());
    }
  }
};

export interface UnitPlacementSystemHandle {
  getGridPositions: () => THREE.Vector3[][];
}

export const UnitPlacementSystem = forwardRef<UnitPlacementSystemHandle, Props>(
  ({ scene, gridSize = 5, tileSize = 1, playerId }, ref) => {
    const gridRef = useRef<THREE.Group | null>(null);
    const gridPositionsRef = useRef<THREE.Vector3[][]>([]);

    useImperativeHandle(ref, () => ({
      getGridPositions: () => gridPositionsRef.current,
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
          const playerOffsetZ = playerId === 1 ? -gridSize - 2 : gridSize + 2; // add spacing of 2 units
          line.position.set(
            worldX + (playerId === 1 ? -gridSize : 0),
            0.01,
            worldZ + playerOffsetZ
          );

          gridGroup.add(line);
          row.push(line.position.clone());
        }

        positions.push(row);
      }

      gridPositionsRef.current = positions;
      scene.add(gridGroup);
      gridRef.current = gridGroup;

      return () => {
        scene.remove(gridGroup);
      };
    }, [scene, gridSize, tileSize, playerId]);

    return null;
  }
);

export default UnitPlacementSystem;
