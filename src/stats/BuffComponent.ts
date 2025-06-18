import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";
import { StatModifier } from "./StatTypes";

/** Holds all temporary or item-driven modifiers. */
export class BuffComponent extends GameComponent {
  mods: StatModifier[] = [];

  constructor(go: GameObject) {
    super(go);
  }

  add(mod: StatModifier) {
    this.mods.push(mod);
  }

  removeBySource(source: string) {
    this.mods = this.mods.filter((m) => m.source !== source);
  }
}
