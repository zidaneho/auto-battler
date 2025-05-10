import { SafeArray } from "../ecs/SafeArray";
import { Vector3 } from "../ecs/Vector3";
import { DebugMesh } from "../meshes/DebugMesh";
import { CollisionComponent } from "../physics/CollisionComponent";
import { CharacterRigidbody } from "../physics/CharacterRigidbody";
import { SphereCollider } from "../physics/SphereCollider";
import { SkinInstance } from "../SkinInstance";
import { ProjectileController } from "./ProjectileController";
import { Rigidbody } from "../physics/Rigidbody";
import { ProjectileDamage } from "./ProjectileDamage";

export class ProjectileManager {
  constructor(
    gameObjectManager,
    scene,
    physics_world,
    prefix_name = "projectile"
  ) {
    this.gameObjectManager = gameObjectManager;
    this.scene = scene;
    this.prefix_name = prefix_name;
    this.projectiles = new SafeArray();
    this.physicsWorld = physics_world;
  }
  createProjectile(spawnPosition, model, speed, direction, teamId, damage) {
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
