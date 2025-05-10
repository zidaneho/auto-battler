import * as RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";
import { Vector3 } from "../ecs/Vector3";

export class CharacterRigidbody extends GameComponent {
  constructor(gameObject, physics_world_ref, colliderDesc, offset) {
    super(gameObject);
    this.offset = offset;

    const pos = gameObject.transform.position;
    const bodyDesc =
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        pos.x + offset.x,
        pos.y + offset.y,
        pos.z + offset.z
      );

    this.body = physics_world_ref.createRigidBody(bodyDesc);
    this.collider = physics_world_ref.createCollider(colliderDesc, this.body);

    // Cached vector to reduce allocations
    this._cachedVector3 = new RAPIER.Vector3(0, 0, 0);
    this.cachedQuaternion = new RAPIER.Quaternion();
  }

  setPosition(vector3) {
    const v = this._cachedVector3;
    v.x = vector3.x + this.offset.x;
    v.y = vector3.y + this.offset.y;
    v.z = vector3.z + this.offset.z;

    this.body.setNextKinematicTranslation(v);
  }

  move(vector3) {
    if (!isFinite(vector3.x) || !isFinite(vector3.y) || !isFinite(vector3.z)) {
      console.warn("Attempted to move with invalid vector", vector3);
      return;
    }
    const currentPos = this.body.translation();
    const v = this._cachedVector3;
    v.x = currentPos.x + vector3.x;
    v.y = currentPos.y + vector3.y;
    v.z = currentPos.z + vector3.z;

    this.body.setNextKinematicTranslation(v);
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
