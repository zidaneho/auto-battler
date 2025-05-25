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

  constructor(
    gameObject: GameObject,
    speed: number,
    start:Vector3,
    target: Vector3,
    gravity: number
  ) {
    super(gameObject);
    this.speed = speed;
    this.rigidbody = gameObject.getComponent(Rigidbody);

    this.startPosition = start;
    this.endPosition = target; // Optional clone if target moves
    this.gravity = gravity;
  }

  update(delta: number): void {
    if (!this.rigidbody || this.initialized) return;

    const velocity = computeBallisticVelocity(
      this.startPosition,
      this.endPosition,
      this.speed,
      this.gravity
    );

    this.rigidbody.body.setLinvel(
      { x: velocity.x, y: velocity.y, z: velocity.z },
      true
    );

    const target = new THREE.Vector3().addVectors(
      this.gameObject.transform.position,
      velocity
    );
    this.gameObject.transform.lookAt(target);

    this.initialized = true;
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
