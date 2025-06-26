import React, { useState, useEffect } from "react";
import { UnitBlueprint } from "@/units/UnitBlueprint";
import { allUnitBlueprints } from "@/units/UnitBlueprintList";
import { Player } from "@/types/gameTypes";
import { GridTile, UnitPlacementSystemHandle } from "@/units/UnitPlacementSystem";

interface RandomUnitShopProps {
  player: Player;
  onPurchase: (blueprint: UnitBlueprint, tile: GridTile) => boolean;
  getPlacementSystem: () => UnitPlacementSystemHandle | null;
}

const RandomUnitShop: React.FC<RandomUnitShopProps> = ({
  player,
  onPurchase,
  getPlacementSystem,
}) => {
  const [randomUnits, setRandomUnits] = useState<UnitBlueprint[]>([]);

  useEffect(() => {
    // Select 5 random units to display in the shop
    const shuffled = [...allUnitBlueprints].sort(() => 0.5 - Math.random());
    setRandomUnits(shuffled.slice(0, 5));
  }, []);

  const handleBuyUnit = (blueprint: UnitBlueprint) => {
    const placementSystem = getPlacementSystem();
    if (!placementSystem) {
      alert("Placement system not ready.");
      return;
    }

    const gridPositions = placementSystem.getGridTiles();
    let availableTile: GridTile | null = null;

    // Find an available tile for the player
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
      alert("No available space to place the unit!");
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "12px",
        backgroundColor: "rgba(20, 20, 30, 0.85)",
        border: "1px solid #445",
        borderRadius: "10px",
        zIndex: 20,
        boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
        alignItems: "center",
      }}
    >
      <h3 style={{ color: "white", margin: 0 }}>Initial Random Shop</h3>
      <div style={{ display: "flex", gap: "12px" }}>
        {randomUnits.map((unit) => {
          const canAfford = player.gold >= unit.cost;
          return (
            <button
              key={unit.name}
              onClick={() => handleBuyUnit(unit)}
              disabled={!canAfford}
              className="flex flex-col items-center p-2 text-white bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                cursor: !canAfford ? "not-allowed" : "pointer",
                backgroundColor: !canAfford ? "#4a5568" : "#2c5282",
                color: "white",
                border: `1px solid ${!canAfford ? "#2d3748" : "#2c3e50"}`,
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: "90px",
                opacity: !canAfford ? 0.6 : 1,
                transition: "background-color 0.2s, opacity 0.2s",
              }}
              title={canAfford ? `Buy ${unit.name} (${unit.cost} Gold)` : "Not enough gold"}
            >
              <span>{unit.name}</span>
              <span className="text-sm text-yellow-400">{unit.cost} Gold</span>
            </button>
          );
        })}
      </div>
     
    </div>
  );
};

export default RandomUnitShop;