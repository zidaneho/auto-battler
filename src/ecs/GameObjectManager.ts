import { SafeArray } from "@/ecs/SafeArray";
import { GameObject } from "@/ecs/GameObject";
import * as RAPIER from "@dimforge/rapier3d";
import { CollisionComponent } from "../physics/CollisionComponent";
import * as THREE from "three";

export class GameObjectManager {
  gameObjects: SafeArray<GameObject> = new SafeArray();
  world: RAPIER.World | null;
  eventQueue: RAPIER.EventQueue;
  handleMap: Map<number, GameObject> = new Map();
  private nameTable: Map<string, number> = new Map<string, number>();

  constructor(physics_world: RAPIER.World | null) {
    this.world = physics_world;
    this.eventQueue = new RAPIER.EventQueue(true);
  }

  createGameObject(
    parent: THREE.Object3D,
    name: string,
    tag: string = ""
  ): GameObject {
    const nameCount = this.nameTable.get(name);

    if (nameCount !== undefined || nameCount == 0) {
      //duplicate name!
      this.nameTable.set(name, nameCount + 1);
      name = name + " (" + nameCount + ")";
    } else {
      //register the name
      this.nameTable.set(name, 1);
    }
    const gameObject = new GameObject(parent, name, tag);
    this.gameObjects.add(gameObject);
    return gameObject;
  }

  removeGameObject(gameObject: GameObject): void {
    this.gameObjects.remove(gameObject);

    gameObject.destroy();

    //  Robust way to remove from the map:
    const handlesToRemove: number[] = [];
    this.handleMap.forEach((go, handle) => {
      if (go === gameObject) {
        handlesToRemove.push(handle);
      }
    });
    handlesToRemove.forEach((handle) => {
      this.handleMap.delete(handle);
    });

    gameObject.parent?.remove(gameObject.transform);

    gameObject.transform.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });

    gameObject._listeners = {};

    const nameCount = this.nameTable.get(gameObject.name);
    if (nameCount && nameCount <= 1) {
      this.nameTable.delete(gameObject.name);
    }
    if (nameCount) {
      this.nameTable.set(gameObject.name, nameCount - 1);
    }
  }

  registerCollider(handle: number, gameObject: GameObject): void {
    this.handleMap.set(handle, gameObject);
  }

  update(delta: number): void {
    if (this.world == null) {
      console.log("physics world is null!");
      return;
    }
    this.world.step(this.eventQueue);
    this.eventQueue.drainCollisionEvents((hA, hB, started) => {
      const goA = this.handleMap.get(hA);
      const goB = this.handleMap.get(hB);

      if (goA) {
        const collision = goA.getComponent(CollisionComponent);
        if (collision) {
          collision._notify(goB ?? null, started);
        }
      }
      if (goB) {
        const collision = goB.getComponent(CollisionComponent);
        if (collision) {
          collision._notify(goA ?? null, started);
        }
      }
    });

    this.gameObjects.forEach((gameObject) => gameObject.update(delta));

    this.gameObjects.forEach((gameObject) => {
      if (gameObject.markedForRemoval) {
        this.removeGameObject(gameObject);
      }
    });
  }
}
