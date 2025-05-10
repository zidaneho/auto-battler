import { GameComponent } from "../ecs/GameComponent";
import * as THREE from "three";
import { Rigidbody } from "../physics/Rigidbody";

export class ProjectileController extends GameComponent {
  constructor(gameObject, speed, direction) {
    super(gameObject);
    this.speed = speed;
    this.direction = direction.clone().normalize();

    this.rigidbody = gameObject.getComponent(Rigidbody);
    this.initialized = false;
  }

  update(delta) {
    if (!this.initialized) {
      // Set the projectile's initial velocity
      const velocity = this.direction.clone().multiplyScalar(this.speed);
      this.rigidbody.body.setLinvel(
        { x: velocity.x, y: velocity.y, z: velocity.z },
        true
      );
      this.initialized = true;
    }

    // Make the object look in the direction of motion
    const target = new THREE.Vector3().addVectors(
      this.gameObject.transform.position,
      this.direction
    );
    this.gameObject.transform.lookAt(target);
  }
}
