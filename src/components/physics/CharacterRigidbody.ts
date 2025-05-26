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
  private world: RAPIER.World;

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
    const bodyDesc =
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        pos.x + offset.x,
        pos.y + offset.y,
        pos.z + offset.z
      );

    this.body = physics_world_ref.createRigidBody(bodyDesc);
    this.body.lockRotations(true, true); // Lock X and Y rotation

    this.collider = physics_world_ref.createCollider(colliderDesc, this.body);

    this._cachedVector3 = new RAPIER.Vector3(0, 0, 0);
    this.world = physics_world_ref;
  }

  destroy() {
    if (this.body && this.world.getRigidBody(this.body.handle)) {
      this.world.removeRigidBody(this.body);
    }
  }

  getCorePosition() {
    const pos = this.gameObject.transform.position.clone();
    return pos.add(this.offset);
  }

  setPosition(vector3: Vector3): void {
    const v = this._cachedVector3;
    v.x = vector3.x + this.offset.x;
    v.y = vector3.y + this.offset.y;
    v.z = vector3.z + this.offset.z;

    this.body.setNextKinematicTranslation(v);
  }

  move(direction: Vector3): void {
    if (
      !isFinite(direction.x) ||
      !isFinite(direction.y) ||
      !isFinite(direction.z)
    )
      return;

    const current = this.body.translation();
    const next = this._cachedVector3;
    next.x = current.x + direction.x;
    next.y = current.y + direction.y;
    next.z = current.z + direction.z;

    this.body.setNextKinematicTranslation(next);
  }

  update(delta: number): void {
    const pos = this.body.translation();
    const vector = new Vector3(pos.x, pos.y, pos.z).sub(this.offset);
    this.gameObject.setPosition(vector);
  }
}
