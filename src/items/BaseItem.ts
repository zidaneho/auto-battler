import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";
import { StatModifier } from "@/stats/StatTypes";
import { Unit } from "@/units/Unit";
import { ItemBlueprint } from "./ItemBlueprint";

/**
 * The base class for all items. It handles the logic for common item types like
 * stat-enhancing items and one-time use consumables. Special items will extend this class.
 */
export class BaseItem extends GameComponent {
    public readonly blueprint: ItemBlueprint;
    public owner: Unit | null = null;

    constructor(gameObject : GameObject, blueprint: ItemBlueprint) {
        super(gameObject);
        this.blueprint = blueprint;
        const unit = gameObject.getComponent(Unit);
        if (unit) {
            this.owner = unit;
            this.equip(unit)
        }
        
    }

    /**
     * Equips the item to a unit. Primarily for 'statStick' items.
     * @param owner The unit that will equip the item.
     */
    public equip(owner: Unit): void {
        this.owner = owner;

        if (this.blueprint.type === 'statStick' && this.blueprint.modifier) {
            const modifierWithSource: StatModifier = {
                ...this.blueprint.modifier,
                source: this.blueprint.id,
            };
            this.owner.buffComponent.add(modifierWithSource);
            this.owner.dirtyStats = true;
        }
    }

    /**
     * Unequips the item from the owner, reversing its effects.
     */
    public unequip(): void {
        if (!this.owner) return;

        if (this.blueprint.type === 'statStick' && this.blueprint.modifier) {
            this.owner.buffComponent.removeBySource(this.blueprint.id);
            this.owner.dirtyStats = true;
        }
        this.owner = null;
    }

    /**
     * Activates the item's effect. Primarily for 'consumable' items.
     * @param target The unit to use the item on.
     */
    public use(target: Unit): void {
        if (this.blueprint.type === 'consumable' && this.blueprint.healAmount) {
            target.healthComponent.heal(this.blueprint.healAmount);
            console.log(`${target.gameObject.name} used ${this.blueprint.name} and healed for ${this.blueprint.healAmount}.`);
        }
        // After a consumable is used, it should be removed from the player's inventory.
    }

    /**
     * The update loop for an item. This is intended to be overridden by child classes
     * for special items that have continuous effects.
     * @param delta The time elapsed since the last frame.
     */
    public update(delta: number): void {
        // Base implementation is empty.
    }

    /**
     * Cleans up the item by unequipping it.
     */
    public destroy(): void {
        this.unequip();
    }
}