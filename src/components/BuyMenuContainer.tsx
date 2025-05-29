import React from "react";
import * as THREE from "three";
import BuyMenu from "@/components/BuyMenu"; // Adjust path
import { UnitBlueprint } from "@/components/UnitBlueprint"; // Adjust path
import { allUnitBlueprints } from "@/components/UnitBlueprintList"; // Adjust path
import { UnitPlacementSystemHandle } from "@/components/UnitPlacementSystem"; // Adjust path
import { Player } from "@/types/gameTypes"; // Adjust path

interface BuyMenuContainerProps {
  players: Player[];
  isGameActive: boolean;
  roundState: "setup" | "battle" | "end";
  // gridPositions: THREE.Vector3[][] | undefined; // From placementRef.current?.getGridPositions()
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>; // For getPlayerPlacementSystem and getOccupiedSlots
  maxUnitsPerPlayer: number;
  onPurchaseUnit: (
    blueprint: UnitBlueprint,
    position: THREE.Vector3,
    playerId: number
  ) => boolean;
}

const BuyMenuContainer: React.FC<BuyMenuContainerProps> = ({
  players,
  isGameActive,
  roundState,
  placementRef,
  maxUnitsPerPlayer,
  onPurchaseUnit,
}) => {
  if (!isGameActive || roundState !== "setup") {
    return null;
  }

  const getPlayerPlacementSystem = (): UnitPlacementSystemHandle | null => {
    return placementRef.current;
  };

  const getOccupiedSlots = (): THREE.Vector3[] => {
    return players.flatMap((p) =>
      p.units.map((unit) => unit.gameObject.transform.position)
    );
  };

  // Check if grid positions are available, as BuyMenu might depend on them implicitly or explicitly
  const gridPositions = placementRef.current?.getGridPositions();
  if (!gridPositions) {
      console.warn("BuyMenuContainer: Grid positions not available from placement system.");
      // return null; // Or handle differently if BuyMenu can operate without them
  }


  return (
    <>
      {players.map((player) => (
        <BuyMenu
          key={`buy-menu-${player.id}`}
          playerId={player.id}
          playerGold={player.gold}
          blueprints={allUnitBlueprints} // Assuming this is the global list of blueprints
          onPurchase={onPurchaseUnit}
          getPlacementSystem={getPlayerPlacementSystem}
          getOccupiedSlots={() => getOccupiedSlots()} // Pass player-specific occupied slots
          maxUnitsPerPlayer={maxUnitsPerPlayer}
        />
      ))}
    </>
  );
};

export default BuyMenuContainer;