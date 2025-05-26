import RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";

export class BoxCollider extends GameComponent {
  description: RAPIER.ColliderDesc;

  constructor(
    gameObject: GameObject,
    width: number,
    height: number,
    depth: number
  ) {
    super(gameObject);
    this.description = RAPIER.ColliderDesc.cuboid(
      width / 2,
      height / 2,
      depth / 2
    );
  }
}
