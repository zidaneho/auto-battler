import { GameComponent } from "./ecs/GameComponent";
import * as RAPIER from "@dimforge/rapier3d";

export class StaticBody extends GameComponent {
  constructor(gameObject, physics_world, colliderDesc) {
    super(gameObject);
    const pos = gameObject.transform.position;
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      pos.x,
      pos.y,
      pos.z
    );
    const body = physics_world.createRigidBody(bodyDesc);
    this.body = body;

    physics_world.createCollider(colliderDesc, body);
  }

  

  update(delta) {
    const pos = this.body.translation();
    this.gameObject.transform.position.set(pos.x, pos.y, pos.z);
  }
}
