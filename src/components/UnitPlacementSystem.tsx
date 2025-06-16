import { Unit } from "@/units/Unit";
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as THREE from "three";

interface Props {
  scene: THREE.Scene;
  position: THREE.Vector3;
  gridSize?: number;
  tileSize?: number;
}

// The GridTile class you created
export class GridTile {
  row: number;
  col: number;
  position: THREE.Vector3;
  occupiedUnit : Unit | null;

  constructor(row: number, col: number, position: THREE.Vector3) {
    this.row = row;
    this.col = col;
    this.position = position.clone();
    this.occupiedUnit = null;
  }
}

export function getMaxUnits(grid: GridTile[][]): number {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    count += grid[i].length;
  }
  return count;
}
export interface UnitPlacementSystemHandle {
  getGridTiles: () => GridTile[][]; // CHANGED: To return the rich tile objects
  getTileSize: () => number;
  getGrid(position: THREE.Vector3): GridTile | null;
  markOccupied: (
    tileRow: number,
    tileCol: number,
    occupiedUnit : Unit | null,
  ) => void; // CHANGED: Simplified signature
}

export const UnitPlacementSystem = forwardRef<UnitPlacementSystemHandle, Props>(
  ({ scene, position, gridSize = 5, tileSize = 1 }, ref) => {
    const gridRef = useRef<THREE.Group | null>(null);
    // CHANGE: The grid is now stored as a 2D array of GridTile objects.
    const gridTilesRef = useRef<GridTile[][]>([]);

    const validLength = tileSize;

    useImperativeHandle(ref, () => ({
      getGridTiles: () => gridTilesRef.current, // CHANGED: Expose the GridTile array
      getTileSize: () => tileSize,
      getGrid(position: THREE.Vector3): GridTile | null {
        let closestLength = Infinity;
        let closestTile: GridTile | undefined;

        // CHANGE: Iterate over the GridTile objects
        gridTilesRef.current.flat().forEach((tile) => {
          const distanceTo = position.distanceTo(tile.position);
          if (distanceTo < closestLength) {
            closestLength = distanceTo;
            closestTile = tile;
          }
        });

        if (closestTile !== undefined && closestLength <= validLength) {
          return closestTile;
        }

        return null;
      },
      // CHANGE: This now updates both the tile object and the lookup dictionary
      markOccupied: (
        tileRow: number,
        tileCol: number,
        occupiedUnit : Unit | null
      ) => {
        // Find the tile in our grid and update its personal occupied status
        if (tileRow < 0 || tileRow > gridTilesRef.current.length) return;
        if (tileCol < 0 || tileCol > gridTilesRef.current[tileRow].length)
          return;
        gridTilesRef.current[tileRow][tileCol].occupiedUnit = occupiedUnit;
      },
    }));

    useEffect(() => {
      if (!scene) return;
      const gridGroup = new THREE.Group();
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });

      // CHANGE: This will now be an array of GridTile arrays
      const newGrid: GridTile[][] = [];
      const offset = (gridSize * tileSize) / 2;
      for (let x = 0; x < gridSize; x++) {
        const row: GridTile[] = []; // This row will hold GridTile objects

        for (let z = 0; z < gridSize; z++) {
          const worldX = x * tileSize + tileSize / 2;
          const worldZ = z * tileSize + tileSize / 2;

          const squareGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-tileSize / 2, 0, -tileSize / 2),
            new THREE.Vector3(tileSize / 2, 0, -tileSize / 2),
            new THREE.Vector3(tileSize / 2, 0, tileSize / 2),
            new THREE.Vector3(-tileSize / 2, 0, tileSize / 2),
            new THREE.Vector3(-tileSize / 2, 0, -tileSize / 2),
          ]);

          const line = new THREE.Line(squareGeometry, material);
          line.position.set(worldX - offset, 0.01, worldZ - offset);
          gridGroup.add(line);

          const gridPos = line.position.clone().add(position);

          // CHANGE: Create a new GridTile instance and push it to the row
          const tile = new GridTile(x, z, gridPos);
          row.push(tile);
        }
        newGrid.push(row);
      }

      gridTilesRef.current = newGrid; // Set the main ref to our new grid of tiles

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
