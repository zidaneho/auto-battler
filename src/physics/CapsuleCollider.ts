import RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";

export class CapsuleCollider extends GameComponent {
  description: RAPIER.ColliderDesc;

  constructor(gameObject: GameObject, half_height: number, radius: number) {
    super(gameObject);
    this.description = RAPIER.ColliderDesc.capsule(half_height, radius);
  }
}
