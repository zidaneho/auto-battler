import { ItemBlueprint } from "./ItemBlueprint";

export class PlayerItem {
    itemBp : ItemBlueprint;
    count : number;
    constructor(itemBp : ItemBlueprint, count : number) {
        this.itemBp = itemBp;
        this.count = count;
    }
}