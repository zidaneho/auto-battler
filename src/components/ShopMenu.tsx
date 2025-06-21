import React from "react";
import { ItemBlueprint } from "@/items/ItemBlueprint";
import { Player } from "@/types/gameTypes";

interface ShopMenuProps {
  player: Player;
  items: ItemBlueprint[];
  onPurchase: (item: ItemBlueprint) => void;
}

const ShopMenu: React.FC<ShopMenuProps> = ({ player, items, onPurchase }) => {
  return (
    <div className="flex gap-4 p-4 bg-gray-800 rounded-lg">
      {items.map((item) => {
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