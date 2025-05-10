import RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";

export class CapsuleCollider extends GameComponent {
  constructor(gameObject, half_height, radius) {
    super(gameObject);
    this.description = RAPIER.ColliderDesc.capsule(half_height, radius);
  }
}
