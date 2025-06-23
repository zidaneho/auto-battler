import React from "react";
import { Player } from "@/types/gameTypes";
import { UnitBlueprint } from "@/units/UnitBlueprint";
import {
  GridTile,
  UnitPlacementSystemHandle,
} from "@/units/UnitPlacementSystem";
import ShopMenu from "./ShopMenu";
import RandomShopMenu from "./RandomShopMenu";
import RandomUnitMenu from "./RandomUnitMenu";
import { allItemBlueprints } from "@/items/ItemBlueprintList";
import { ItemBlueprint } from "@/items/ItemBlueprint";
import BuyMenu from "./BuyMenu";
import { allUnitBlueprints } from "@/units/UnitBlueprintList";

interface ShopMenuContainerProps {
  players: Player[];
  isGameActive: boolean;
  roundState: string;
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>;
  maxUnitsPerPlayer: number;
  currentRound : number;
  onPurchaseUnit: (
    blueprint: UnitBlueprint,
    tile: GridTile,
    playerId: number
  ) => boolean;
  onPurchaseItem: (item: ItemBlueprint, playerId: number) => void;
  onReroll: (playerId: number) => void;
}

const ShopMenuContainer: React.FC<ShopMenuContainerProps> = ({
  players,
  isGameActive,
  roundState,
  placementRef,
  maxUnitsPerPlayer,
  currentRound,
  onPurchaseUnit,
  onPurchaseItem,
  onReroll,
}) => {
  if (!isGameActive || roundState !== "shop" || !placementRef.current) {
    return null;
  }

  const getPlayerPlacementSystem = (): UnitPlacementSystemHandle | null => {
    return placementRef.current;
  };

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col gap-4">
      {players.map((player) => (
        <div key={player.id} className="flex flex-col gap-2">
          <h3 className="text-white text-lg font-bold">
            Player {player.id}'s Shop
          </h3>
          {/* Row 1: Items */}
          <ShopMenu
            player={player}
            currentRound={currentRound} // Show first 3 items
            onPurchase={(item) => onPurchaseItem(item, player.id)}
          />
          {/* Row 2: Random Items */}
          <RandomShopMenu
            player={player}
            onPurchase={(item) => onPurchaseItem(item, player.id)}
            onReroll={() => onReroll(player.id)}
            luck={0} // Placeholder
          />
          {/* Row 4: Random Units */}
          <RandomUnitMenu
            player={player}
            onPurchase={(blueprint, tile) =>
              onPurchaseUnit(blueprint, tile, player.id)
            }
            onReroll={() => onReroll(player.id)}
            luck={0} // Placeholder
            getPlacementSystem={getPlayerPlacementSystem}
          />
        </div>
      ))}
    </div>
  );
};

export default ShopMenuContainer;
