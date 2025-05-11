import { SafeArray } from "../ecs/SafeArray";
import { Vector3 } from "three";
import { DebugMesh } from "../meshes/DebugMesh";
import { CollisionComponent } from "../physics/CollisionComponent";
import { Rigidbody } from "../physics/Rigidbody";
import { SphereCollider } from "../physics/SphereCollider";
import { SkinInstance } from "../SkinInstance";
import { ProjectileController } from "./ProjectileController";
import { GameObject } from "../ecs/GameObject";
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';
import { ProjectileDamage } from "./ProjectileDamage";
import { Model } from "../meshes/ModelList";


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
    direction: THREE.Vector3,
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

    gameObject.addComponent(CollisionComponent);

    this.gameObjectManager.registerCollider(
      rigidbody.collider.handle,
      gameObject
    );

    gameObject.addComponent(SkinInstance, model);
    gameObject.addComponent(ProjectileController, speed, direction);
    gameObject.addComponent(ProjectileDamage, teamId, damage);
    gameObject.addComponent(DebugMesh, rigidbody, this.scene);

    this.projectiles.add(gameObject);
  }
}
