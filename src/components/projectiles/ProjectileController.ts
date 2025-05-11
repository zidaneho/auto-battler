import { GameComponent } from "../ecs/GameComponent";
import * as THREE from "three";
import { Rigidbody } from "../physics/Rigidbody";
import { GameObject } from "../ecs/GameObject";
import { Vector3 } from "three";

export class ProjectileController extends GameComponent {
  speed: number;
  direction: THREE.Vector3;
  rigidbody: Rigidbody | undefined;
  initialized: boolean = false;

  constructor(gameObject: GameObject, speed: number, direction: THREE.Vector3) {
    super(gameObject);
    this.speed = speed;
    this.direction = direction.clone().normalize();
    this.rigidbody = gameObject.getComponent(Rigidbody);
  }

  update(delta: number): void {
     if (!this.rigidbody) return;

    if (!this.initialized) {
      const velocity = this.direction.clone().multiplyScalar(this.speed);
      this.rigidbody.body.setLinvel(
        { x: velocity.x, y: velocity.y, z: velocity.z },
        true
      );
      this.initialized = true;
    }

    const target = new THREE.Vector3().addVectors(
      this.gameObject.transform.position,
      this.direction
    );
    this.gameObject.transform.lookAt(target);
  }
}