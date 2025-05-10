//keeps track of the units in the game,
//ensures that units have a target to attack/ run to (if there are any)

import { BoxCollider } from "../physics/BoxCollider";
import { DebugMesh } from "../meshes/DebugMesh";
import { SafeArray } from "../ecs/SafeArray";
import { vector3_distance } from "../ecs/Vector3";
import { CharacterRigidbody } from "../physics/CharacterRigidbody";
import { Knight } from "./Knight";
import { CollisionComponent } from "../physics/CollisionComponent";
import { HealthComponent } from "../HealthComponent";
import { Archer } from "./Archer";
import { UnitStats } from "./UnitStats";

export class UnitManager {
  constructor() {
    this.units = new SafeArray();
  }

  createKnight(
    gameObjectManager,
    parent,
    name,
    model,
    physics_world,
    collider_offset,
    colliderSize,
    teamId
  ) {
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
    gameObjectManager,
    parent,
    name,
    model,
    physics_world,
    collider_offset,
    colliderSize,
    teamId,
    projectileManager,
    projectileSpawnPoint
  ) {
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

  setupUnit(
    gameObjectManager,
    parent,
    name,
    physics_world,
    collider_offset,
    colliderSize
  ) {
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

    const stats = gameObject.addComponent(UnitStats, 100, 10, 1);
    gameObject.addComponent(HealthComponent, stats.health);

    return gameObject;
  }
  removeUnit(unit) {
    this.units.remove(unit);
  }

  update(delta) {
    this.units.forEach((unit) => {
      if (unit.target == null) {
        let minDist = Infinity;
        let target = null;

        this.units.forEach((otherUnit) => {
          if (!unit.canHaveTarget(otherUnit)) {
            return;
          }
          let dist = vector3_distance(
            unit.gameObject.transform.position,
            otherUnit.gameObject.transform.position
          );
          if (dist < minDist) {
            minDist = dist;
            target = otherUnit;
          }
        });
        unit.target = target;
      }
    });
  }
}
