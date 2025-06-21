import React from "react";
import * as THREE from "three";
import { UnitBlueprint } from "../units/UnitBlueprint";
import {
  GridTile,
  UnitPlacementSystemHandle,
} from "../units/UnitPlacementSystem";

interface BuyMenuProps {
  playerId: number;
  playerGold: number;
  blueprints: UnitBlueprint[];
  onPurchase: (
    blueprint: UnitBlueprint,
    tile: GridTile,
    playerId: number
  ) => boolean; // Callback to handle purchase, returns true if successful
  getPlacementSystem: () => UnitPlacementSystemHandle | null; // Gets the player's grid system
  occupiedSlots: THREE.Vector3[]; // Gets currently occupied slots by the player
  maxUnitsPerPlayer: number; // Maximum units a player can have
}

const BuyMenu: React.FC<BuyMenuProps> = ({
  playerId,
  playerGold,
  blueprints,
  onPurchase,
  getPlacementSystem,
  occupiedSlots,
  maxUnitsPerPlayer,
}) => {
  const handleBuyUnit = (blueprint: UnitBlueprint) => {
    const placementSystem = getPlacementSystem();
    if (!placementSystem) {
      console.warn(
        "BuyMenu: Placement system not available for player:",
        playerId
      );
      alert("Placement system not ready. Cannot buy unit.");
      return;
    }

    if (occupiedSlots.length >= maxUnitsPerPlayer) {
      alert("Your board is full! Cannot buy more units.");
      return;
    }

    if (playerGold < blueprint.cost) {
      alert("Not enough gold to buy " + blueprint.name + "!");
      return;
    }

    const gridPositions = placementSystem.getGridTiles(); // These are world positions
    let availableTile: GridTile | null = null;

    // Find the first available slot on the player's grid

    if (playerId == 1) {
      for (let i = 0; i < gridPositions.length / 2; i++) {
        for (const tile of gridPositions[i]) {
          if (tile.occupiedUnit == null) {
            availableTile = tile;
            break;
          }
        }
        if (availableTile) break;
      }
    } else {
      for (
        let i = gridPositions.length - 1;
        i >= gridPositions.length / 2;
        i--
      ) {
        for (const tile of gridPositions[i]) {
          if (tile.occupiedUnit == null) {
            availableTile = tile;
            break;
          }
        }
        if (availableTile) break;
      }
    }

    if (!availableTile) {
      alert("No available slots to place the unit on your board!");
      return;
    }

    const purchaseSuccessful = onPurchase(
      blueprint,
      availableTile, // Ensure we pass a new Vector3 instance
      playerId
    );

    if (purchaseSuccessful) {
      console.log(
        `Player ${playerId} purchased ${blueprint.name} for ${
          blueprint.cost
        }. Placed at ${availableTile.position.x.toFixed(
          2
        )}, ${availableTile.position.z.toFixed(2)}`
      );
    } else {
      // onPurchase should handle specific error alerts if needed
      console.warn(
        `Purchase of ${blueprint.name} failed for Player ${playerId}.`
      );
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: playerId === 1 ? "20px" : "auto", // Position P1 at bottom, P2 at top
        top: playerId === 2 ? "20px" : "auto",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "12px",
        padding: "12px",
        backgroundColor: "rgba(20, 20, 30, 0.85)",
        border: "1px solid #445",
        borderRadius: "10px",
        zIndex: 20,
        boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
      }}
    >
      {blueprints.map((bp) => {
        const occupiedSlotsCount = occupiedSlots.length;
        const canAfford = playerGold >= bp.cost;
        const boardHasSpace = occupiedSlotsCount < maxUnitsPerPlayer;
        const isDisabled = !canAfford || !boardHasSpace;

        let title = `Buy ${bp.name} (${bp.cost} Gold)`;
        if (!canAfford) title = "Not enough gold";
        else if (!boardHasSpace) title = "Board is full";

        return (
          <button
            key={bp.modelKey + "_" + playerId} // Ensure unique key per player
            onClick={() => handleBuyUnit(bp)}
            disabled={isDisabled}
            style={{
              padding: "8px 12px",
              fontSize: "14px",
              cursor: isDisabled ? "not-allowed" : "pointer",
              backgroundColor: isDisabled
                ? "#4a5568"
                : bp.modelKey.includes("knight")
                ? "#2c5282" // Blue for Knight
                : bp.modelKey.includes("archer")
                ? "#2f855a" // Green for Archer
                : bp.modelKey.includes("priest")
                ? "#b7791f" // Orange for Priest
                : "#4CAF50",
              color: "white",
              border: `1px solid ${isDisabled ? "#2d3748" : "#2c3e50"}`,
              borderRadius: "6px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "90px",
              opacity: isDisabled ? 0.6 : 1,
              transition: "background-color 0.2s, opacity 0.2s",
            }}
            title={title}
          >
            {bp.iconUrl && (
              <img
                src={bp.iconUrl}
                alt={bp.name}
                style={{
                  width: "40px",
                  height: "40px",
                  marginBottom: "5px",
                  borderRadius: "4px",
                  border: "1px solid #555",
                }}
              />
            )}
            <span>{bp.name}</span>
            <span style={{ fontSize: "11px", marginTop: "2px" }}>
              {bp.cost} Gold
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BuyMenu;
