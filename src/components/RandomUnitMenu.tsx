import React, { useState, useEffect } from "react";
import { UnitBlueprint } from "@/units/UnitBlueprint";
import { allUnitBlueprints } from "@/units/UnitBlueprintList";
import { Player } from "@/types/gameTypes";
import { GridTile } from "@/units/UnitPlacementSystem";

interface RandomUnitMenuProps {
  player: Player;
  onPurchase: (blueprint: UnitBlueprint, tile: GridTile) => boolean;
  onReroll: () => void;
  luck: number; // Placeholder for luck stat
  getPlacementSystem: () => any;
}

const RandomUnitMenu: React.FC<RandomUnitMenuProps> = ({
  player,
  onPurchase,
  onReroll,
  luck,
  getPlacementSystem,
}) => {
  const [randomUnits, setRandomUnits] = useState<UnitBlueprint[]>([]);

  useEffect(() => {
    reroll();
  }, []);

  const reroll = () => {
    onReroll();
    if (player.gold < 10) return;
    const shuffled = [...allUnitBlueprints].sort(() => 0.5 - Math.random());
    setRandomUnits(shuffled.slice(0, 3)); // Show 3 random units
  };

  const handleBuyUnit = (blueprint: UnitBlueprint) => {
    const placementSystem = getPlacementSystem();
    if (!placementSystem) {
      alert("Placement system not ready.");
      return;
    }

    const gridPositions = placementSystem.getGridTiles();
    let availableTile: GridTile | null = null;

    for (let i = 0; i < gridPositions.length / 2; i++) {
      for (const tile of gridPositions[i]) {
        if (tile.occupiedUnit == null) {
          availableTile = tile;
          break;
        }
      }
      if (availableTile) break;
    }

    if (availableTile) {
      onPurchase(blueprint, availableTile);
    } else {
      alert("No available space!");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex gap-4">
        {randomUnits.map((unit) => {
          const canAfford = player.gold >= unit.cost;
          return (
            <button
              key={unit.name}
              onClick={() => handleBuyUnit(unit)}
              disabled={!canAfford}
              className="flex flex-col items-center p-2 text-white bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              <span>{unit.name}</span>
              <span className="text-sm text-yellow-400">{unit.cost} Gold</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={reroll}
        className="p-2 text-white bg-blue-600 rounded-md hover:bg-blue-500"
      >
        Reroll (10 Gold)
      </button>
    </div>
  );
};

export default RandomUnitMenu;
