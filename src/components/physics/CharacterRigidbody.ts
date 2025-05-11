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

    const pos = gameObject.transform.position;
    const bodyDesc =
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        pos.x + offset.x,
        pos.y + offset.y,
        pos.z + offset.z
      );

    this.body = physics_world_ref.createRigidBody(bodyDesc);
    this.collider = physics_world_ref.createCollider(colliderDesc, this.body);

    this._cachedVector3 = new RAPIER.Vector3(0, 0, 0);
  }

  setPosition(vector3: Vector3): void {
    const v = this._cachedVector3;
    v.x = vector3.x + this.offset.x;
    v.y = vector3.y + this.offset.y;
    v.z = vector3.z + this.offset.z;

    this.body.setNextKinematicTranslation(v);
  }

  move(vector3: Vector3): void {
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

  update(delta: number): void {
    const updatedPos = this.body.translation();
    this.gameObject.transform.position.set(
      updatedPos.x - this.offset.x,
      updatedPos.y - this.offset.y,
      updatedPos.z - this.offset.z
    );
  }
}
