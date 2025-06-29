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
import { AttackReport } from "@/stats/AttackReport";
import { Unit } from "@/units/Unit";
import { FireballTrailSystem } from "@/particles/FireballTrailSystem";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { VFXManager } from "@/particles/VFXManager";

export class ProjectileManager {
  gameObjectManager: GameObjectManager; // Replace 'any' with the actual type of gameObjectManager
  scene: THREE.Scene;
  prefix_name: string;
  projectiles: SafeArray<GameObject>;
  physicsWorld: RAPIER.World | null;
  vfxManager: VFXManager;

  constructor(
    gameObjectManager: GameObjectManager, // Replace 'any' with the actual type
    vfxManager: VFXManager,
    scene: THREE.Scene,
    physics_world: RAPIER.World | null,
    prefix_name: string = "projectile"
  ) {
    this.gameObjectManager = gameObjectManager;
    this.scene = scene;
    this.prefix_name = prefix_name;
    this.projectiles = new SafeArray();
    this.physicsWorld = physics_world;
    this.vfxManager = vfxManager;
  }

  createProjectile(
    spawnPosition: Vector3,
    model: Model | undefined, // Use the Model interface
    speed: number,
    acceleration: number,
    gravity: number,
    targetPos: Vector3,
    teamId: number,
    attackReport: AttackReport,
    lifetime: number,
    vfx?: string
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
    if (model) {
      gameObject.addComponent(SkinInstance, model);
    }

    gameObject.addComponent(
      ProjectileController,
      speed,
      spawnPosition,
      targetPos,
      gravity,
      lifetime, // Corrected order
      acceleration // Corrected order
    );

    if (vfx) {
      this.vfxManager.triggerVFX(vfx,spawnPosition,gameObject.transform);
    }
    

    gameObject.addComponent(ProjectileDamage, teamId, attackReport);
    //gameObject.addComponent(DebugMesh, rigidbody, this.scene);

    this.projectiles.add(gameObject);
  }
}
