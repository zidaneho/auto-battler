import RAPIER from "@dimforge/rapier3d";
import { GameComponent } from "./ecs/GameComponent";
import { Vector3 } from "./ecs/Vector3";

export class KinematicBody extends GameComponent {
  constructor(gameObject, physics_world_ref, colliderDesc) {
    super(gameObject);
    var pos = gameObject.transform.position;
    const bodyDesc =
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        pos.x,
        pos.y,
        pos.z
      );
    const body = physics_world_ref.createRigidBody(bodyDesc);
    this.body = body;

    physics_world_ref.createCollider(colliderDesc, body);
  }

  move(vector3) {
    const current_pos = this.body.translation();
    const new_pos = {
      x: current_pos.x + vector3.x,
      y: current_pos.y + vector3.y,
      z: current_pos.z + vector3.z,
    };
    this.body.setNextKinematicTranslation(new_pos);
  }

  update(delta) {
    //synchronize three js model to kinematic body
    const position = this.body.translation();
    //const rotation = this.body.rotation(); we dont care about rotation
    this.gameObject.transform.position.set(position.x, position.y, position.z);

    // const gravity = new Vector3(0,-9.81,0);
    // gravity.multiply(delta);
    // this.move(gravity);
  }
}
