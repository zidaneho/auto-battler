import { GameComponent } from "@/components/ecs/GameComponent";
import { SkinInstance } from "@/components/SkinInstance";
import { FiniteStateMachine } from "./FiniteStateMachine";

import { UnitStats } from "./UnitStats";
import * as THREE from "three";
import { Rigidbody } from "./Rigidbody";

export class Unit extends GameComponent {
  constructor(gameObject, model, teamId) {
    super(gameObject);

    //a team id of 0 means it can attack anyone
    this.teamId = teamId;
    this.hasTarget = false;
    this.target = null;
    this.health = 100;
    this.unitStats = gameObject.getComponent(UnitStats);

    this.skinInstance = gameObject.addComponent(SkinInstance, model);
    this.skinInstance.setAnimation("shield_02_walk");

    this.rigidbody = gameObject.getComponent(Rigidbody);

    const fsm = new FiniteStateMachine(
      {
        idle: {
          enter: () => {},
          update: (delta) => {
            if (this.target != null && this.health > 0) {
              fsm.transition("chase");
            }
          },
          // exit : () => {

          // }
        },
        chase: {
          update: (delta) => {
            if (this.target != null && this.target.health > 0) {
              const result = new THREE.Vector3();
              const vector = result.subVectors(
                this.target.gameObject.transform.position,
                this.gameObject.transform.position
              );
              vector.normalize();
              vector.multiplyScalar(this.unitStats.moveSpeed * delta);

              this.rigidbody.move(vector);
            } else {
              fsm.transition("idle");
            }
          },
        },
      },
      "idle"
    );
    this.fsm = fsm;
  }

  update(delta) {
    this.fsm.update(delta);
  }
}
