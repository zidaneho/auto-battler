import { GameComponent } from "../ecs/GameComponent";

// components/CollisionComponent.js
export class CollisionComponent extends GameComponent {
    constructor(gameObject) {
      // store a user-provided handler: (otherGameObject, started) => void
      super(gameObject);
    }

  
    // internal helper: called by the manager when a collision happens
    _notify(otherGO, started) {
      this.gameObject.emit("collision",{otherGO,started});
    }
  }