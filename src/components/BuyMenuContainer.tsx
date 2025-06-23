import React from "react";
import * as THREE from "three";
import BuyMenu from "@/components/BuyMenu"; // Adjust path
import { UnitBlueprint } from "@/units/UnitBlueprint"; // Adjust path
import { allUnitBlueprints } from "@/units/UnitBlueprintList"; // Adjust path
import {
  GridTile,
  UnitPlacementSystemHandle,
} from "@/units/UnitPlacementSystem"; // Adjust path
import { Player } from "@/types/gameTypes"; // Adjust path

interface BuyMenuContainerProps {
  players: Player[];
  isGameActive: boolean;
  // gridPositions: THREE.Vector3[][] | undefined; // From placementRef.current?.getGridPositions()
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>; // For getPlayerPlacementSystem and getOccupiedSlots
  maxUnitsPerPlayer: number;
  onPurchaseUnit: (
    blueprint: UnitBlueprint,
    tile: GridTile,
    playerId: number
  ) => boolean;
}

const BuyMenuContainer: React.FC<BuyMenuContainerProps> = ({
  players,
  isGameActive,
  placementRef,
  maxUnitsPerPlayer,
  onPurchaseUnit,
}) => {
  if (!isGameActive ||  !placementRef.current) {
    return null;
  }

  const getPlayerPlacementSystem = (): UnitPlacementSystemHandle | null => {
    return placementRef.current;
  };

  // Check if grid positions are available, as BuyMenu might depend on them implicitly or explicitly
  const gridPositions = placementRef.current.getGridTiles();
  if (!gridPositions) {
    console.warn(
      "BuyMenuContainer: Grid positions not available from placement system."
    );
    // return null; // Or handle differently if BuyMenu can operate without them
  }

  return (
    <>
      {players.map((player) => {
        // CHANGE: Calculate occupied slots for the current player here.
        const occupiedSlots = player.units.map(
          (unit) => unit.gameObject.transform.position
        );

        return (
          <BuyMenu
            key={`buy-menu-${player.id}`}
            playerId={player.id}
            playerGold={player.gold}
            blueprints={allUnitBlueprints}
            onPurchase={onPurchaseUnit}
            getPlacementSystem={getPlayerPlacementSystem}
            occupiedSlots={occupiedSlots} // CHANGE: Pass the array directly
            maxUnitsPerPlayer={maxUnitsPerPlayer}
          />
        );
      })}
    </>
  );
};

export default BuyMenuContainer;
