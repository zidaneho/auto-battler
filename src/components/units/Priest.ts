import { Unit } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "../FiniteStateMachine";
import { HealthComponent } from "../HealthComponent";
import { GameObject } from "../ecs/GameObject";

export class Priest extends Unit {
  hasAttacked: boolean = false;
  attackTimer: number = 0;
  attackClipLength: number | undefined;
  damagePoint: number;
  fsm: FiniteStateMachine<string>;

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
            if (
              this.target != null &&
              this.target.healthComponent.isAlive() &&
              !this.target.healthComponent.isOverhealed()
            ) {
              const result = new THREE.Vector3();
              const vector = result.subVectors(
                this.target.gameObject.transform.position,
                this.gameObject.transform.position
              );

              if (vector.length() <= 4) {
                fsm.transition("heal");
              }

              vector.normalize();
              vector.multiplyScalar(this.unitStats.moveSpeed * delta);

              this.rigidbody?.move(vector);
              this.gameObject.lookAt(vector, this.forward);
            } else {
              this.target = null;
              fsm.transition("idle");
            }
          },
        },
        heal: {
          enter: () => {
            this.attackTimer = 0;
            this.skinInstance.playAnimation("cast_A");
            this.attackClipLength = this.skinInstance.getClipLength();
            this.hasAttacked = false;
          },
          update: (delta: number) => {
            if (this.attackClipLength === undefined) {
              return;
            }

            this.skinInstance.setAnimationSpeed(this.attackSpeed);
            this.attackTimer += delta;

            if (
              this.target != null &&
              !this.hasAttacked &&
              this.attackTimer >=
                this.damagePoint *
                  this.attackClipLength *
                  (1 / this.attackSpeed)
            ) {
              this.healTarget(this.target);
              this.hasAttacked = true;
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

  healTarget(target: Unit) {
    if (target.healthComponent != null && target.healthComponent.isAlive()) {
      target.healthComponent.heal(this.unitStats.healingPower);
    }
  }
  //Override canHaveTarget to allow healing allies
  override canHaveTarget(otherUnit: Unit): boolean {
    //Priests can target allies who need healing
    if (
      otherUnit !== this &&
      this.teamId === otherUnit.teamId &&
      otherUnit.healthComponent.isAlive() &&
      !otherUnit.healthComponent.isOverhealed()
    ) {
      return true;
    }

    return false;
  }

  update(delta: number) {
    super.update(delta);
    if (this.healthComponent && !this.healthComponent.isAlive()) {
      this.fsm.transition("death");
    }
    this.fsm.update(delta);
  }
}
