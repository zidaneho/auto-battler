import { SafeArray } from "../ecs/SafeArray";
import { Vector3 } from "three";
import { DebugMesh } from "../components/meshes/DebugMesh";
import { CollisionComponent } from "../physics/CollisionComponent";
import { Rigidbody } from "../physics/Rigidbody";
import { SphereCollider } from "../physics/SphereCollider";
import { SkinInstance } from "../components/SkinInstance";
import { ProjectileController } from "./ProjectileController";
import { GameObject } from "../ecs/GameObject";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { ProjectileDamage } from "./ProjectileDamage";
import { Model } from "../components/ModelStore";

export class ProjectileManager {
  gameObjectManager: any; // Replace 'any' with the actual type of gameObjectManager
  scene: THREE.Scene;
  prefix_name: string;
  projectiles: SafeArray<GameObject>;
  physicsWorld: RAPIER.World | null;

  constructor(
    gameObjectManager: any, // Replace 'any' with the actual type
    scene: THREE.Scene,
    physics_world: RAPIER.World | null,
    prefix_name: string = "projectile"
  ) {
    this.gameObjectManager = gameObjectManager;
    this.scene = scene;
    this.prefix_name = prefix_name;
    this.projectiles = new SafeArray();
    this.physicsWorld = physics_world;
  }

  createProjectile(
    spawnPosition: Vector3,
    model: Model | undefined, // Use the Model interface
    speed: number,
    gravity: number,
    targetPos: Vector3,
    teamId: number,
    damage: number
  ): void {
    const gameObject = this.gameObjectManager.createGameObject(
      this.scene,
      this.prefix_name + this.projectiles.length,
      ""
    );
    const collider = gameObject.addComponent(SphereCollider, 0.5);
    collider.description.setSensor(true);
    const colliderOffset = new Vector3(0, 0, 0);
    const rigidbody = gameObject.addComponent(
      Rigidbody,
      this.physicsWorld,
      collider.description,
      colliderOffset
    );
    rigidbody.setPosition(spawnPosition);

    gameObject.addComponent(
      CollisionComponent,
      this.gameObjectManager,
      rigidbody.body,
      rigidbody.collider
    );

    gameObject.addComponent(SkinInstance, model);
    gameObject.addComponent(
      ProjectileController,
      speed,
      spawnPosition,
      targetPos,
      gravity
    );
    gameObject.addComponent(ProjectileDamage, teamId, damage);
    gameObject.addComponent(DebugMesh, rigidbody, this.scene);

    this.projectiles.add(gameObject);
  }
}
