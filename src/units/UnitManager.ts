import { BoxCollider } from "@/physics/BoxCollider";
import { DebugMesh } from "@/components/meshes/DebugMesh";
import { SafeArray } from "@/ecs/SafeArray";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { HealthComponent } from "@/stats/HealthComponent";
import { Archer } from "./Archer";
import { UnitStats } from "./UnitStats";
import { Priest } from "./Priest";
import { GameObject } from "@/ecs/GameObject";
import { Vector3 } from "three";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { Unit } from "./Unit";
import {
  AttackDef,
  UnitBlueprint,
  UnitBlueprintStats,
} from "@/components/UnitBlueprint";
import { useModelStore } from "@/components/ModelStore";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { ClickableComponent } from "@/components/ClickableComponent";
import { CollisionComponent } from "@/physics/CollisionComponent";
import { StatRefreshSystem } from "@/stats/StatRefreshSystem";

export class UnitManager {
  units: SafeArray<Unit>;
  goManager: GameObjectManager;

  constructor(gameObjectManager: GameObjectManager) {
    this.units = new SafeArray();
    this.goManager = gameObjectManager;
  }

  createUnit<T extends Unit>(
    UnitType: new (gameObject: GameObject, ...args: any[]) => T,
    stats: UnitBlueprintStats,
    teamId: number,
    spawnPosition: Vector3,
    attackDef: AttackDef,
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

    gameObject.addComponent(
      UnitStats,
      stats.health,
      stats.armor,
      stats.magArmor,
      stats.attack,
      stats.attackSpeed,
      stats.critChance,
      stats.range,
      stats.moveSpeed,
      stats.healingPower
    );

    const unit = gameObject.addComponent(
      UnitType,
      model,
      teamId,
      spawnPosition,
      attackDef,
      ...unitArgs
    );
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
  update(now: number): void {
    this.units.forEach((unit: Unit) => {
      if (unit.target == null) {
        this.findNewTarget(unit);
      }

      if (unit.dirtyStats) {
        StatRefreshSystem.rebuild(unit, now);
      }
    });
  }
}
