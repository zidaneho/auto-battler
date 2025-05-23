import { Unit } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "../FiniteStateMachine";
import { GameObject } from "../ecs/GameObject";

export class Knight extends Unit {
  fsm: FiniteStateMachine<string>; // Declare fsm as a class property
  hasAttacked: boolean = false;
  attackTimer: number = 0;
  attackClipLength: number | undefined;
  damagePoint: number;

  constructor(gameObject: GameObject, model: any, teamId: number) {
    super(gameObject, model, teamId);

    const deathAction = this.skinInstance.getAction("death_A");
    if (deathAction) {
      deathAction.clampWhenFinished = true;
      deathAction.setLoop(THREE.LoopOnce, 1);
    }
    this.damagePoint = model.damagePoint1;

    const fsm = new FiniteStateMachine<string>(
      {
        idle: {
          enter: () => {
            this.skinInstance.playAnimation("idle");
          },
          update: (delta: number) => {
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
          update: (delta: number) => {
            if (this.target != null && this.target.healthComponent.isAlive()) {
              const result = new THREE.Vector3();
              const vector = result.subVectors(
                this.target.gameObject.transform.position,
                this.gameObject.transform.position
              );

              if (vector.length() <= 1) {
                fsm.transition("attack");
              }

              vector.normalize();
              vector.multiplyScalar(this.unitStats.moveSpeed * delta);

              this.rigidbody?.move(vector);
              this.gameObject.lookAt(vector, this.forward);
            } else {
              fsm.transition("idle");
            }
          },
        },
        attack: {
          enter: () => {
            this.attackTimer = 0;
            this.skinInstance.playAnimation("attack_A");
            this.attackClipLength = this.skinInstance.getClipLength();
          },
          update: (delta: number) => {
            if (this.attackClipLength === undefined) {
              return;
            }
        
            this.skinInstance.setAnimationSpeed(this.unitStats.attackSpeed);
            this.attackTimer += delta;

            if (
              this.target != null &&
              !this.hasAttacked &&
              this.attackTimer >=
                this.damagePoint *
                  this.attackClipLength *
                  (1 / this.unitStats.attackSpeed)
            ) {
              this.dealDamage(this.target);
            } else if (
              this.attackTimer >=
              this.attackClipLength * (1 / this.unitStats.attackSpeed)
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
            this.rigidbody?.body.setEnabled(false);
          },
        },
      },
      "idle"
    );
    this.fsm = fsm; // Assign the FSM instance to the class property
  }

  update(delta: number) {
    super.update(delta);
    if (this.healthComponent && !this.healthComponent.isAlive()) {
      this.fsm.transition("death");
    }
    this.fsm.update(delta);
  }
}
