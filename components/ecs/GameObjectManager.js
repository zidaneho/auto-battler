import { SafeArray } from "@/components/ecs/SafeArray";
import { GameObject } from "@/components/ecs/GameObject";
import * as RAPIER from "@dimforge/rapier3d";
import { CollisionComponent } from "../physics/CollisionComponent";

export class GameObjectManager {
  constructor(physics_world) {
    this.gameObjects = new SafeArray();
    this.world = physics_world;
    this.eventQueue = new RAPIER.EventQueue(true);
    this.handleMap = new Map();
  }
  createGameObject(parent, name,tag="") {
    const gameObject = new GameObject(parent, name,tag);
    this.gameObjects.add(gameObject);
    return gameObject;
  }
  removeGameObject(gameObject) {
    this.gameObjects.remove(gameObject);

    for (const [handle, go] of this.handleMap.entries()) {
      if (go === gameObject) {
        this.handleMap.delete(handle);
      }
    }
    // Remove from scene
    gameObject.parent?.remove(gameObject.transform);

    // Dispose of mesh/geometry
    gameObject.transform.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });

    for (const component of gameObject.components) {
      gameObject.removeComponent(component);
    }

    // Clear event listeners
    gameObject._listeners = {};
  }
  registerCollider(handle, gameObject) {
    this.handleMap.set(handle, gameObject);
  }
  update(delta) {
    this.world.step(this.eventQueue);
    this.eventQueue.drainCollisionEvents((hA, hB, started) => {
      // if (started) {
      //   console.log(`Collision started between ${hA} and ${hB}`);
      // } else {
      //   console.log(`Collision ended between ${hA} and ${hB}`);
      // }
      const goA = this.handleMap.get(hA);
      const goB = this.handleMap.get(hB);

      if (goA) {
        const collision = goA.getComponent(CollisionComponent);
        if (collision != null) {
          collision._notify(goB, started);
        }
      }
      if (goB) {
        const collision = goB.getComponent(CollisionComponent);
        if (collision != null) {
          collision._notify(goA, started);
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
