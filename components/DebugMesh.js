import { GameComponent } from "./ecs/GameComponent";
import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";

function createColliderMesh(collider) {
  let geometry, mesh;

  const shape = collider.shapeType();

  if (shape === RAPIER.ShapeType.Cuboid) {
    const halfExtents = collider.halfExtents(); // {x, y, z}
    geometry = new THREE.BoxGeometry(
      halfExtents.x * 2,
      halfExtents.y * 2,
      halfExtents.z * 2
    );
  } else if (shape === RAPIER.ShapeType.Ball) {
    const radius = collider.radius();
    geometry = new THREE.SphereGeometry(radius, 16, 16);
  } else if (shape === RAPIER.ShapeType.Capsule) {
    const halfHeight = collider.halfHeight();
    const radius = collider.radius();
    geometry = new THREE.CapsuleGeometry(radius, halfHeight * 2, 4, 8);
  } else {
    console.warn("Unknown collider shape for visualization.");
    return null;
  }

  const material = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    wireframe: true,
  });
  mesh = new THREE.Mesh(geometry, material);

  return mesh;
}

export class DebugMesh extends GameComponent {
  constructor(gameObject, bodyComponent, scene) {
    super(gameObject);
    this.bodyComponent = bodyComponent;
    const mesh = createColliderMesh(bodyComponent.collider);

    if (mesh) {
      scene.add(mesh);
      this.mesh = mesh;
    } else {
      console.warn("failed to create debug mesh");
      this.mesh = null;
    }
  }
  update(delta) {
    if (this.mesh) {
      const translation = this.bodyComponent.body.translation();
      const rotation = this.bodyComponent.body.rotation();
      this.mesh.position.set(translation.x, translation.y, translation.z);
      this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }
}
