import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";

export class CollisionComponent extends GameComponent {
  constructor(gameObject: GameObject) {
    super(gameObject);
  }

  _notify(otherGO: GameObject | null, started: boolean): void {
    this.gameObject.emit("collision", { otherGO, started });
  }
}