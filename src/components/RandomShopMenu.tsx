import React, { useState, useEffect } from "react";
import { ItemBlueprint } from "@/items/ItemBlueprint";
import { allItemBlueprints } from "@/items/ItemBlueprintList";
import { Player } from "@/types/gameTypes";

interface RandomShopMenuProps {
  player: Player;
  onPurchase: (item: ItemBlueprint) => void;
  onReroll: () => void;
  luck: number; // Placeholder for luck stat
}

const RandomShopMenu: React.FC<RandomShopMenuProps> = ({
  player,
  onPurchase,
  onReroll,
  luck,
}) => {
  const [randomItems, setRandomItems] = useState<ItemBlueprint[]>([]);

  useEffect(() => {
    reroll();
  }, []);

  const reroll = () => {
    onReroll();
    if (player.gold < 10) return;
    const shuffled = [...allItemBlueprints].sort(() => 0.5 - Math.random());
    setRandomItems(shuffled.slice(0, 3)); // Show 3 random items
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex gap-4">
        {randomItems.map((item) => {
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
      <button
        onClick={reroll}
        className="p-2 text-white bg-blue-600 rounded-md hover:bg-blue-500"
      >
        Reroll (10 Gold)
      </button>
    </div>
  );
};

export default RandomShopMenu;
