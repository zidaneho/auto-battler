import { BoxCollider } from "../physics/BoxCollider";
import { DebugMesh } from "../meshes/DebugMesh";
import { SafeArray } from "../ecs/SafeArray";
import { CharacterRigidbody } from "../physics/CharacterRigidbody";
import { Knight } from "./Knight";
import { CollisionComponent } from "../physics/CollisionComponent";
import { HealthComponent } from "../HealthComponent";
import { Archer } from "./Archer";
import { UnitStats } from "./UnitStats";
import { Priest } from "./Priest";
import { GameObject } from "../ecs/GameObject";
import { Vector3 } from "three";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { Unit } from "./Unit";

export class UnitManager {
  units: SafeArray<Unit>;

  constructor() {
    this.units = new SafeArray();
  }

  createKnight(
    gameObjectManager: any, // Replace 'any' with the actual type
    parent: THREE.Object3D,
    name: string,
    model: any, // Replace 'any' with the actual type
    physics_world: RAPIER.World,
    collider_offset: Vector3,
    colliderSize: Vector3,
    teamId: number
  ): GameObject {
    const gameObject = this.setupUnit(
      gameObjectManager,
      parent,
      name,
      physics_world,
      collider_offset,
      colliderSize
    );

    gameObject.addComponent(UnitStats, 1000, 10, 1);
    const unit = gameObject.addComponent(Knight, model, teamId);

    this.units.add(unit);
    return gameObject;
  }
  createArcher(
    gameObjectManager: any, // Replace 'any' with the actual type
    parent: THREE.Object3D,
    name: string,
    model: any, // Replace 'any' with the actual type
    physics_world: RAPIER.World,
    collider_offset: Vector3,
    colliderSize: Vector3,
    teamId: number,
    projectileManager: any, // Replace 'any' with the actual type
    projectileSpawnPoint: Vector3
  ): GameObject {
    const gameObject = this.setupUnit(
      gameObjectManager,
      parent,
      name,
      physics_world,
      collider_offset,
      colliderSize
    );
    const unit = gameObject.addComponent(
      Archer,
      model,
      teamId,
      projectileManager,
      projectileSpawnPoint
    );

    this.units.add(unit);
    return gameObject;
  }
  createPriest(
    gameObjectManager: any, // Replace 'any' with the actual type
    parent: THREE.Object3D,
    name: string,
    model: any, // Replace 'any' with the actual type
    physics_world: RAPIER.World,
    collider_offset: Vector3,
    colliderSize: Vector3,
    teamId: number
  ): GameObject {
    const gameObject = this.setupUnit(
      gameObjectManager,
      parent,
      name,
      physics_world,
      collider_offset,
      colliderSize
    );

    const unit = gameObject.addComponent(Priest, model, teamId);

    this.units.add(unit);
    return gameObject;
  }

  setupUnit(
    gameObjectManager: any, // Replace 'any' with the actual type
    parent: THREE.Object3D,
    name: string,
    physics_world: RAPIER.World,
    collider_offset: Vector3,
    colliderSize: Vector3
  ): GameObject {
    const gameObject = gameObjectManager.createGameObject(parent, name, "unit");
    const offset = collider_offset;
    const collider = gameObject.addComponent(
      BoxCollider,
      colliderSize.x,
      colliderSize.y,
      colliderSize.z
    );

    const rigidbody = gameObject.addComponent(
      CharacterRigidbody,
      physics_world,
      collider.description,
      offset
    );
    gameObject.addComponent(CollisionComponent);
    gameObject.addComponent(DebugMesh, rigidbody, parent);
    gameObjectManager.registerCollider(rigidbody.collider.handle, gameObject);

    const stats = gameObject.addComponent(UnitStats, 100, 10, 1, 40);
    gameObject.addComponent(HealthComponent, stats.health);

    return gameObject;
  }
  removeUnit(unit: Unit): void {
    this.units.remove(unit);
  }

  update(delta: number): void {
    this.units.forEach((unit: Unit) => {
      if (unit.target == null) {
        let minDist = Infinity;
        let target: Unit | null = null;
        
        this.units.forEach((otherUnit: Unit) => {
          if (unit.canHaveTarget(otherUnit)) {
            let dist = unit.gameObject.transform.position.distanceTo(
              otherUnit.gameObject.transform.position
            );
            if (dist < minDist) {
              minDist = dist;
              target = otherUnit;
            }
          }
        });
        unit.target = target;
      }
    });
  }
}
