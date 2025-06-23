import { GameComponent } from "../ecs/GameComponent";
import * as THREE from "three";
import { Rigidbody } from "../physics/Rigidbody";
import { GameObject } from "../ecs/GameObject";
import { Vector3 } from "three";

export class ProjectileController extends GameComponent {
  speed: number;
  rigidbody: Rigidbody | undefined;
  initialized: boolean = false;
  startPosition: Vector3;
  endPosition: Vector3;
  gravity: number;
  lifetime: number;
  acceleration: number; // Now a scalar
  private velocity: Vector3 = new Vector3(0, 0, 0);

  constructor(
    gameObject: GameObject,
    speed: number,
    start: Vector3,
    target: Vector3,
    gravity: number,
    lifetime: number,
    acceleration: number // Now a scalar
  ) {
    super(gameObject);
    this.speed = speed;
    this.lifetime = lifetime;
    this.rigidbody = gameObject.getComponent(Rigidbody);
    this.acceleration = acceleration;

    this.startPosition = start;
    this.endPosition = target; // Optional clone if target moves
    this.gravity = gravity;
    this.velocity = computeBallisticVelocity(
      this.startPosition,
      this.endPosition,
      this.speed,
      this.gravity
    );
    this.rigidbody?.body.setLinvel(
      { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z },
      true
    );
  }

  update(delta: number): void {
    if (!this.rigidbody) return;

    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.gameObject.markedForRemoval = true;
      return;
    }

    // Apply scalar acceleration
    const currentVel = this.rigidbody.body.linvel();
    const velocityVector = new THREE.Vector3(currentVel.x, currentVel.y, currentVel.z);

    const currentSpeed = velocityVector.length();
    const newSpeed = currentSpeed + this.acceleration * delta;

    velocityVector.normalize().multiplyScalar(newSpeed);

    this.rigidbody.body.setLinvel({ x: velocityVector.x, y: velocityVector.y, z: velocityVector.z }, true);

    // Every frame: rotate to face velocity
    if (velocityVector.lengthSq() > 0.0001) {
      const currentPos = this.gameObject.transform.position;
      const target = new THREE.Vector3().addVectors(currentPos, velocityVector);
      this.gameObject.transform.lookAt(target);
    }
  }
}

function computeBallisticVelocity(
  startPos: Vector3,
  targetPos: Vector3,
  speed: number,
  gravity: number
): Vector3 {
  const displacement = new THREE.Vector3().subVectors(targetPos, startPos);
  const horizontal = new THREE.Vector3(displacement.x, 0, displacement.z);
  const y = displacement.y;
  const xz = horizontal.length();

  const speed2 = speed * speed;
  const g = gravity;

  const root = speed2 * speed2 - g * (g * xz * xz + 2 * y * speed2);

  if (root < 0) {
    const fallbackDir = new THREE.Vector3()
      .subVectors(targetPos, startPos)
      .normalize();
    return fallbackDir.multiplyScalar(speed).setY(-gravity);
  }

  const angle = Math.atan((speed2 - Math.sqrt(root)) / (g * xz));
  horizontal.normalize();

  const vy = Math.sin(angle) * speed;
  const vxz = Math.cos(angle) * speed;

  return horizontal.multiplyScalar(vxz).setY(vy);
}