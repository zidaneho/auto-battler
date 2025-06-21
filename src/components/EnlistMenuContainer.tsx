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
  onPurchaseUnit: (
    blueprint: UnitBlueprint,
    tile: GridTile,
    playerId: number
  ) => boolean;
  onPurchaseItem: (item: ItemBlueprint, playerId: number) => void;
  onReroll: (playerId: number) => void;
}

const EnlistMenuContainer: React.FC<ShopMenuContainerProps> = ({
  players,
  isGameActive,
  roundState,
  placementRef,
  onPurchaseUnit,
}) => {
  if (!isGameActive || roundState !== "enlist" || !placementRef.current) {
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
            Player {player.id}'s Enlist
          </h3>
            

          
        </div>
      ))}
    </div>
  );
};

export default EnlistMenuContainer;
