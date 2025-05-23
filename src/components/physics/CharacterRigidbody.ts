import * as RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";
import { Vector3 } from "three";

export class CharacterRigidbody extends GameComponent {
  offset: Vector3;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  private _cachedVector3: RAPIER.Vector3;
  cachedQuaternion: RAPIER.Quaternion = new RAPIER.Quaternion(0, 0, 0, 1);

  constructor(
    gameObject: GameObject,
    physics_world_ref: RAPIER.World,
    colliderDesc: RAPIER.ColliderDesc,
    offset: Vector3
  ) {
    super(gameObject);
    this.offset = offset;

    colliderDesc
      .setFriction(1)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min);

    const pos = gameObject.transform.position;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
      pos.x + offset.x,
      pos.y + offset.y,
      pos.z + offset.z
    );

    this.body = physics_world_ref.createRigidBody(bodyDesc);
    this.body.setGravityScale(0, false);
    this.body.lockRotations(true, true); // X, Y, Z

    this.collider = physics_world_ref.createCollider(colliderDesc, this.body);

    this._cachedVector3 = new RAPIER.Vector3(0, 0, 0);
  }

  setPosition(vector3: Vector3): void {
    const v = this._cachedVector3;
    v.x = vector3.x + this.offset.x;
    v.y = vector3.y + this.offset.y;
    v.z = vector3.z + this.offset.z;

    this.body.setTranslation(v, true); // ✅ not setLinvel
  }

  move(direction: Vector3): void {
    if (
      !isFinite(direction.x) ||
      !isFinite(direction.y) ||
      !isFinite(direction.z)
    )
      return;

    const velocity = new RAPIER.Vector3(direction.x, direction.y, direction.z);

    this.body.setLinvel(velocity, true);
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
