import * as RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";
import { Vector3 } from "three";

export class Rigidbody extends GameComponent {
  offset: Vector3;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  private world: RAPIER.World;

  constructor(
    gameObject: GameObject,
    physics_world_ref: RAPIER.World,
    colliderDesc: RAPIER.ColliderDesc,
    offset: Vector3
  ) {
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

    this.world = physics_world_ref;
  }

  destroy() {
    this.world.removeRigidBody(this.body);
  }

  applyImpulse(vector3: Vector3): void {
    const impulse = new RAPIER.Vector3(vector3.x, vector3.y, vector3.z);
    this.body.applyImpulse(impulse, true);
  }

  setPosition(vector3: Vector3): void {
    this.body.setTranslation(
      {
        x: vector3.x + this.offset.x,
        y: vector3.y + this.offset.y,
        z: vector3.z + this.offset.z,
      },
      true
    );
  }

  update(delta: number): void {
    const updatedPos = this.body.translation();
    this.gameObject.transform.position.set(
      updatedPos.x - this.offset.x,
      updatedPos.y - this.offset.y,
      updatedPos.z - this.offset.z
    );
  }
}
