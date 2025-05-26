// components/ecs/GameComponent.ts
import { GameObject } from "./GameObject";

// Base for all components
export class GameComponent {
  gameObject: GameObject;
  enabled:boolean = true;

  constructor(gameObject: GameObject) {
    this.gameObject = gameObject;
  }

  update(delta: number): void {}
  destroy(): void {}
}