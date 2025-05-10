import * as RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";

export class Rigidbody extends GameComponent {
  constructor(gameObject, physics_world_ref, colliderDesc, offset) {
    super(gameObject);
    this.offset = offset;

    const pos = gameObject.transform.position;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
      pos.x + offset.x,
      pos.y + offset.y,
      pos.z + offset.z
    );

    this.body = physics_world_ref.createRigidBody(bodyDesc);
    this.collider = physics_world_ref.createCollider(colliderDesc, this.body);

    this._cachedVector3 = new RAPIER.Vector3(0, 0, 0);
  }

  // Optionally move the body using impulse
  applyImpulse(vector3) {
    const impulse = new RAPIER.Vector3(vector3.x, vector3.y, vector3.z);
    this.body.applyImpulse(impulse, true);
  }

  setPosition(vector3) {
    this.body.setTranslation(
      {
        x: vector3.x + this.offset.x,
        y: vector3.y + this.offset.y,
        z: vector3.z + this.offset.z,
      },
      true
    );
  }

  update(delta) {
    const updatedPos = this.body.translation();
    this.gameObject.transform.position.set(
      updatedPos.x - this.offset.x,
      updatedPos.y - this.offset.y,
      updatedPos.z - this.offset.z
    );
  }
}
