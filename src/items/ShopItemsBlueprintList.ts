import { ShopItemsBlueprint } from "./ShopItemsBlueprint";

export const shopItems1: ShopItemsBlueprint = {
  itemIds: ["healing_potion"],
  roundAvailable: 1,
};

export const shopItems2: ShopItemsBlueprint = {
  itemIds: ["healing_potion", "boots_of_speed"],
  roundAvailable: 2,
};

export const allShopItems: ShopItemsBlueprint[] = [shopItems1, shopItems2];
