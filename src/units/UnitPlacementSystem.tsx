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
  occupiedUnit: Unit | null;

  constructor(row: number, col: number, position: THREE.Vector3) {
    this.row = row;
    this.col = col;
    this.position = position.clone();
    this.occupiedUnit = null;
  }
  toString(): string {
    return "[" + this.row.toString() + " " + this.col.toString() + "]";
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
    occupiedUnit: Unit | null
  ) => void; // CHANGED: Simplified signature
  clearOccupied: () => void;
}

export const UnitPlacementSystem = forwardRef<UnitPlacementSystemHandle, Props>(
  ({ scene, position, gridSize = 5, tileSize = 1 }, ref) => {
    const gridRef = useRef<THREE.Group | null>(null);
    // CHANGE: The grid is now stored as a 2D array of GridTile objects.
    const gridTilesRef = useRef<GridTile[][]>([]);

    const gridCenterPosition = position; // Capture the grid's center from props

    useImperativeHandle(ref, () => ({
      getGridTiles: () => gridTilesRef.current,
      getTileSize: () => tileSize,
      getGrid(worldPosition: THREE.Vector3): GridTile | null {
        // Calculate the grid's top-left corner in world space.
        const halfSize = (gridSize * tileSize) / 2;
        const gridOriginX = gridCenterPosition.x - halfSize;
        const gridOriginZ = gridCenterPosition.z - halfSize;

        // Get the position relative to the grid's origin.
        const relativeX = worldPosition.x - gridOriginX;
        const relativeZ = worldPosition.z - gridOriginZ;

        // Calculate the row and column index by dividing by the tile size.
        // In your grid setup, the X-axis corresponds to the row, and the Z-axis to the column.
        const row = Math.floor(relativeX / tileSize);
        const col = Math.floor(relativeZ / tileSize);

        // Check if the calculated indices are within the valid bounds of the grid.
        if (
          gridTilesRef.current[row] &&
          gridTilesRef.current[row][col] !== undefined
        ) {
          return gridTilesRef.current[row][col];
        }

        // If the position is outside the grid bounds, return null.
        return null;
      },

      markOccupied: (
        tileRow: number,
        tileCol: number,
        occupiedUnit: Unit | null
      ) => {
        if (
          gridTilesRef.current[tileRow] &&
          gridTilesRef.current[tileRow][tileCol] !== undefined
        ) {
          gridTilesRef.current[tileRow][tileCol].occupiedUnit = occupiedUnit;
        }
      },
      clearOccupied: () => {
        gridTilesRef.current.forEach((row) => {
          row.forEach((tile) => {
            tile.occupiedUnit = null;
          });
        });
        console.log("UnitPlacementSystem: All tiles marked as unoccupied.");
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
