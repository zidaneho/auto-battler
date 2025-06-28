import React, { useState, useEffect, useCallback } from "react";
import { ItemBlueprint } from "@/items/ItemBlueprint";
import { allItemBlueprints } from "@/items/ItemBlueprintList";
import { Player } from "@/types/gameTypes";

interface RandomShopMenuProps {
  player: Player;
  onPurchase: (item: ItemBlueprint) => void;
  onReroll: () => void;
  // The number of items to display in the shop
  itemCount?: number;
  luck : number;
}

const RandomShopMenu: React.FC<RandomShopMenuProps> = ({
  player,
  onPurchase,
  onReroll,
  itemCount = 3, // Default to showing 3 items
}) => {
  const [randomItems, setRandomItems] = useState<ItemBlueprint[]>([]);
  const REROLL_COST = 10;

  // Function to generate a new set of random items
  const generateRandomItems = useCallback(() => {
    const allItems = Object.values(allItemBlueprints);
    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    setRandomItems(shuffled.slice(0, itemCount));
  }, [itemCount]);

  // Generate items on initial component mount
  useEffect(() => {
    generateRandomItems();
  }, [generateRandomItems]);

  // Handle the reroll action
  const handleReroll = () => {
    if (player.gold < REROLL_COST) {
      alert("Not enough gold to reroll!");
      return;
    }
    // Parent component handles gold deduction
    onReroll();
    // Generate a new set of items
    generateRandomItems();
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-center gap-4">
        {randomItems.map((item) => {
          const canAfford = player.gold >= item.cost;
          return (
            <button
              key={`random-${item.id}`}
              onClick={() => onPurchase(item)}
              disabled={!canAfford}
              className="flex flex-col items-center p-2 text-white bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 w-24"
              title={item.description}
            >
              <span className="font-semibold">{item.name}</span>
              {item.iconUrl && (
                <img
                  src={item.iconUrl}
                  alt={item.name}
                  className="w-10 h-10 my-1"
                />
              )}
              <span className="text-sm text-yellow-400">{item.cost} Gold</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={handleReroll}
        disabled={player.gold < REROLL_COST}
        className="p-2 text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        Reroll ({REROLL_COST} Gold)
      </button>
    </div>
  );
};

export default RandomShopMenu;
