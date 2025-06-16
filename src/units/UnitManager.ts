import { BoxCollider } from "@/physics/BoxCollider";
import { DebugMesh } from "@/components/meshes/DebugMesh";
import { SafeArray } from "@/ecs/SafeArray";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { HealthComponent } from "@/components/HealthComponent";
import { Archer } from "./Archer";
import { UnitStats } from "./UnitStats";
import { Priest } from "./Priest";
import { GameObject } from "@/ecs/GameObject";
import { Vector3 } from "three";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { Unit } from "./Unit";
import { UnitBlueprint } from "@/components/UnitBlueprint";
import { useModelStore } from "@/components/ModelStore";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { ClickableComponent } from "@/components/ClickableComponent";

export class UnitManager {
  units: SafeArray<Unit>;
  goManager: GameObjectManager;

  constructor(gameObjectManager: GameObjectManager) {
    this.units = new SafeArray();
    this.goManager = gameObjectManager;
  }

  instantiateUnit(
    blueprint: UnitBlueprint,
    spawnPosition: Vector3,
    teamId: number,
    gameObjectManager: any,
    parent: THREE.Object3D,
    physics_world: RAPIER.World
  ): GameObject {
    const colliderSize = blueprint.collider?.size ?? new THREE.Vector3(1, 1, 1);
    const colliderOffset =
      blueprint.collider?.offset ?? new THREE.Vector3(0, 0, 0);

    const gameObject = this.setupUnit(
      spawnPosition,
      gameObjectManager,
      parent,
      blueprint.name ?? blueprint.modelKey,
      physics_world,
      colliderOffset,
      colliderSize
    );

    const model = useModelStore((s) => s.getModel(blueprint.modelKey));
    if (model === undefined) {
      console.warn(blueprint.modelKey, "is not loaded yet!");
      return gameObject;
    }
    const unit = gameObject.addComponent(
      blueprint.unitClass,
      model.gltf,
      teamId
    );

    // Optional stat overrides
    if (blueprint.stats) {
      const stats = gameObject.getComponent(UnitStats)!;
      stats.moveSpeed = blueprint.stats.moveSpeed;
      stats.attackSpeed = blueprint.stats.attackSpeed;
      stats.health = blueprint.stats.health;
    }

    this.units.add(unit);
    const body = gameObject.getComponent(CharacterRigidbody);
    return gameObject;
  }

  createUnit<T extends Unit>(
    UnitType: new (gameObject: GameObject, ...args: any[]) => T,
    spawnPosition: Vector3,
    gameObjectManager: GameObjectManager,
    parent: THREE.Object3D,
    name: string,
    model: any,
    physics_world: RAPIER.World,
    collider_offset: Vector3,
    colliderSize: Vector3,
    ...unitArgs: any[]
  ): GameObject {
    const gameObject = this.setupUnit(
      gameObjectManager,
      spawnPosition,
      parent,
      name,
      physics_world,
      collider_offset,
      colliderSize
    );

    const unit = gameObject.addComponent(UnitType, model, ...unitArgs);
    unit.enabled = false;

    this.units.add(unit);
    return gameObject;
  }

  setupUnit(
    gameObjectManager: any, // Replace 'any' with the actual type
    spawnPosition: Vector3,
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
    rigidbody.setPosition(gameObject.transform.position);
    gameObject.addComponent(DebugMesh, rigidbody, parent);
    gameObjectManager.registerCollider(rigidbody.collider.handle, gameObject);

    const stats = gameObject.addComponent(UnitStats, 100, 10, 25, 40);
    gameObject.addComponent(HealthComponent, stats.health);

    gameObject.addComponent(ClickableComponent);

    return gameObject;
  }
  removeUnit(unit: Unit): void {
    this.units.remove(unit);
    this.goManager.removeGameObject(unit.gameObject);
  }
  getAllUnits(): Unit[] {
    const allUnits: Unit[] = [];
    this.units.forEach((unit) => allUnits.push(unit));
    return allUnits;
  }

  clearAllUnits(): void {
    // Re-initializing the SafeArray is often the safest way to clear it,
    // especially if its remove operations are deferred or complex.
    this.units.forEach((unit: Unit) => {
      if (unit.gameObject != null) {
        this.goManager.removeGameObject(unit.gameObject);
      }
    });
    this.units = new SafeArray();
  }
  playAllUnits(): void {
    this.units.forEach((unit: Unit) => {
      unit.enabled = true;
    });
  }

  setTargets(): void {
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
  findNewTarget(unit: Unit): void {
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
  getAliveUnits(playerId: number) {
    let count = 0;
    this.units.forEach((unit: Unit) => {
      if (unit.teamId == playerId && unit.healthComponent.health > 0) {
        count++;
      }
    });
    return count;
  }
  update(): void {
    this.units.forEach((unit: Unit) => {
      if (unit.target == null) {
        this.findNewTarget(unit);
      }
    });
  }
}
