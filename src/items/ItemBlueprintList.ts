import { ItemBlueprint } from "@/items/ItemBlueprint";

export const allItemBlueprints: ItemBlueprint[] = [
  {
    id: "sword_of_courage",
    name: "Sword of Courage",
    cost: 100,
    rarity: "common",
    description: "+10 Attack",
    modifier: {
      flat: {
        attack: 10,
      },
      source: "Sword of Courage",
    },
  },
  {
    id: "shield_of_valor",
    name: "Shield of Valor",
    cost: 100,
    rarity: "common",
    description: "+15 Armor",
    modifier: {
      flat: {
        armor: 15,
      },
      source: "Shield of Valor",
    },
  },
  {
    id: "boots_of_speed",
    name: "Boots of Speed",
    cost: 150,
    rarity: "uncommon",
    description: "+20% Move Speed",
    modifier: {
      pct: {
        moveSpeed: 0.2,
      },
      source: "Boots of Speed",
    },
  },
];
