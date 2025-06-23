import React from "react";
import { ItemBlueprint } from "@/items/ItemBlueprint";
import { Player } from "@/types/gameTypes";
import { allShopItems } from "@/items/ShopItemsBlueprintList";
import { ShopItemsBlueprint } from "@/items/ShopItemsBlueprint";
import { allItemBlueprints } from "@/items/ItemBlueprintList";

interface ShopMenuProps {
  player: Player;
  currentRound: number;
  onPurchase: (item: ItemBlueprint) => void;
}

const ShopMenu: React.FC<ShopMenuProps> = ({
  player,
  currentRound,
  onPurchase,
}) => {
  let shopItemsBp: ItemBlueprint[] = [];
  let shopItems: ShopItemsBlueprint | null = null;
  allShopItems.sort(
    (a: ShopItemsBlueprint, b: ShopItemsBlueprint) =>
      a.roundAvailable - b.roundAvailable
  );

  for (let i = allShopItems.length - 1; i >= 0; i--) {
    shopItems = allShopItems[i];
    if (currentRound >= shopItems.roundAvailable) {
      break;
    }
  }
  if (shopItems) {
    for (let j = 0; j < shopItems.itemIds.length; j++) {
      const itemBlueprint = allItemBlueprints[shopItems.itemIds[j]];
      if (itemBlueprint) {
        shopItemsBp.push(itemBlueprint);
      } else {
        console.warn(
          "Could not find",
          shopItems.itemIds[j],
          "in all item blueprints"
        );
      }
    }
  }

  return (
    <div className="flex gap-4 p-4 bg-gray-800 rounded-lg">
      {shopItemsBp.map((item) => {
        const canAfford = player.gold >= item.cost;
        return (
          <button
            key={item.id}
            onClick={() => onPurchase(item)}
            disabled={!canAfford}
            className="flex flex-col items-center p-2 text-white bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            <span>{item.name}</span>
            <span className="text-sm text-yellow-400">{item.cost} Gold</span>
          </button>
        );
      })}
    </div>
  );
};

export default ShopMenu;
