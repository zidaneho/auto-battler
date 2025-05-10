import { Unit } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "../FiniteStateMachine";

export class Priest extends Unit {
  constructor(gameObject, model, teamId) {
    super(gameObject, model, teamId);

    const deathAction = this.skinInstance.getAction("death_A");
    deathAction.clampWhenFinished = true;
    deathAction.setLoop(THREE.LoopOnce);

    this.hasAttacked = false;
    this.attackTimer = 0;
    this.damagePoint = model.damagePoint1;

    const fsm = new FiniteStateMachine(
      {
        idle: {
          enter: () => {
            this.skinInstance.playAnimation("idle");
          },
          update: (delta) => {
            if (this.target != null) {
              fsm.transition("chase");
            }
          },
          // exit : () => {

          // }
        },
        chase: {
          enter: () => {
            this.skinInstance.playAnimation("walk");
          },
          update: (delta) => {
            if (this.target != null && this.target.healthComponent.isAlive()) {
              const result = new THREE.Vector3();
              const vector = result.subVectors(
                this.target.gameObject.transform.position,
                this.gameObject.transform.position
              );

              if (vector.length() <= 1) {
                fsm.transition("heal");
              }

              vector.normalize();
              vector.multiplyScalar(this.unitStats.moveSpeed * delta);

              this.rigidbody.move(vector);
              this.gameObject.lookAt(vector, this.forward);
            } else {
              fsm.transition("idle");
            }
          },
        },
        heal: {
          enter: () => {
            this.attackTimer = 0;
            this.skinInstance.playAnimation("cast");
            this.attackClipLength = this.skinInstance.getClipLength();
          },
          update: (delta) => {
            this.skinInstance.setAnimationSpeed(this.attackSpeed);
            this.attackTimer += delta;

            if (
              !this.hasAttacked &&
              this.attackTimer >=
                this.damagePoint *
                  this.attackClipLength *
                  (1 / this.attackSpeed)
            ) {
              this.healTarget(this.target);
            } else if (
              this.attackTimer >=
              this.attackClipLength * (1 / this.attackSpeed)
            ) {
              fsm.transition("idle");
            }
          },
          exit: () => {
            this.hasAttacked = false;
          },
        },
        death: {
          enter: () => {
            this.skinInstance.playAnimation("death_A");
          },
        },
      },
      "idle"
    );
    this.fsm = fsm;
  }

  healTarget(target) {
    if (target.healthComponent != null && target.healthComponent.isAlive()) {
      target.healthComponent.heal(this.unitStats.healingPower);
    }
  }
  

  update(delta) {
    super.update(delta);
    if (!this.healthComponent.isAlive()) {
      this.fsm.transition("death");
    }
    this.fsm.update(delta);
  }
}
