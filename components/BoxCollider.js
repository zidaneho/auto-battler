import RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "./ecs/GameComponent";

export class BoxCollider extends GameComponent {
  constructor(gameObject, width, height, depth) {
    super(gameObject);
    this.description = RAPIER.ColliderDesc.cuboid(
      width / 2,
      height / 2,
      depth / 2
    );
  }
}
