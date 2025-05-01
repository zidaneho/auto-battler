//keeps track of the units in the game,
//ensures that units have a target to attack/ run to (if there are any)

import { BoxCollider } from "./BoxCollider";
import { DebugMesh } from "./DebugMesh";
import { SafeArray } from "./ecs/SafeArray";
import { vector3_distance } from "./ecs/Vector3";
import { Rigidbody } from "./Rigidbody";
import { Unit } from "./Unit";
import { UnitStats } from "./UnitStats";

export class UnitManager {
  constructor() {
    this.units = new SafeArray();
  }

  createUnit(
    gameObjectManager,
    parent,
    name,
    model,
    physics_world,
    collider_offset,
    colliderSize,
    teamId
  ) {
    const gameObject = gameObjectManager.createGameObject(parent, name);
    const offset = collider_offset;
    const collider = gameObject.addComponent(
      BoxCollider,
      colliderSize.x,
      colliderSize.y,
      colliderSize.z
    );
    const rigidbody = gameObject.addComponent(
      Rigidbody,
      physics_world,
      collider.description,
      offset
    );

    gameObject.addComponent(UnitStats, 100, 10, 1);

    const unit = gameObject.addComponent(Unit, model, teamId);

    gameObject.addComponent(DebugMesh, rigidbody, parent);

    this.units.add(unit);
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
          if (
            unit === otherUnit ||
            unit.teamId === otherUnit.teamId ||
            otherUnit.health <= 0
          ) {
            console.log("Men", unit === otherUnit);
            console.log("b", unit.teamId === otherUnit.teamId);
            console.log("c", otherUnit.health <= 0);
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
