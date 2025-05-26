import { GameComponent } from "../ecs/GameComponent";
import * as RAPIER from "@dimforge/rapier3d";
import { GameObject } from "../ecs/GameObject";

export class StaticBody extends GameComponent {
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  private world: RAPIER.World;

  constructor(
    gameObject: GameObject,
    physics_world: RAPIER.World,
    colliderDesc: RAPIER.ColliderDesc
  ) {
    super(gameObject);
    const pos = gameObject.transform.position;
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      pos.x,
      pos.y,
      pos.z
    );
    const body = physics_world.createRigidBody(bodyDesc);
    this.body = body;
    this.world = physics_world;

    this.collider = physics_world.createCollider(colliderDesc, body);
  }

  destroy(): void {
    this.world.removeRigidBody(this.body);
  }

  update(delta: number): void {
    const pos = this.body.translation();
    this.gameObject.transform.position.set(pos.x, pos.y, pos.z);
  }
}
