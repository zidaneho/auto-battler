import RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";

export class SphereCollider extends GameComponent {
  description: RAPIER.ColliderDesc;

  constructor(gameObject: GameObject, radius: number) {
    super(gameObject);
    this.description = RAPIER.ColliderDesc.ball(radius);
    
  }
}