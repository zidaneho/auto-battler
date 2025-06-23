import { StatModifier } from "@/stats/StatTypes";

export type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

export type ItemType = "statStick" | "consumable";

export interface ItemBlueprint {
  id: string;
  name: string;
  cost: number;
  rarity: ItemRarity;
  iconUrl?: string;
  description: string;
  modifier: StatModifier;
  type: ItemType;
  healAmount?: number;
}