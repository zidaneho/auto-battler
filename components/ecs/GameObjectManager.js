import {SafeArray} from "@/components/ecs/SafeArray"
import {GameObject} from "@/components/ecs/GameObject"

export class GameObjectManager {
  constructor() {
    this.gameObjects = new SafeArray();
  }
  createGameObject(parent, name) {
    const gameObject = new GameObject(parent, name);
    this.gameObjects.add(gameObject);
    return gameObject;
  }
  removeGameObject(gameObject) {
    this.gameObjects.remove(gameObject);
  }
  update(delta) {
    this.gameObjects.forEach((gameObject) => gameObject.update(delta));
  }
  
}
