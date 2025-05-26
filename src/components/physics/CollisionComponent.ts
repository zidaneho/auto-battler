import RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";
import { GameObjectManager } from "../ecs/GameObjectManager";

export class CollisionComponent extends GameComponent {
  constructor(
    gameObject: GameObject,
    manager: GameObjectManager,
    body: RAPIER.RigidBody,
    collider: RAPIER.Collider
  ) {
    super(gameObject);
    collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    collider.setActiveCollisionTypes(
      RAPIER.ActiveCollisionTypes.DYNAMIC_KINEMATIC |
        RAPIER.ActiveCollisionTypes.DYNAMIC_FIXED
    );
    body.enableCcd(true);
    manager.registerCollider(collider.handle, gameObject);
  }

  _notify(otherGO: GameObject | null, started: boolean): void {
    this.gameObject.emit("collision", { otherGO, started });
  }
}
