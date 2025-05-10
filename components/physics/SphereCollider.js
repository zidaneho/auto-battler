import RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";

export class SphereCollider extends GameComponent {
  constructor(gameObject, radius) {
    super(gameObject);
    this.description = RAPIER.ColliderDesc.ball(radius).setActiveCollisionTypes(
        RAPIER.ActiveCollisionTypes.DEFAULT |
        RAPIER.ActiveCollisionTypes.DYNAMIC_KINEMATIC |
        RAPIER.ActiveCollisionTypes.DYNAMIC_FIXED
    );
    this.description.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  }
}
