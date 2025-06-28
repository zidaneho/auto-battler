import { Unit, UnitConstructionParams } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "@/components/FiniteStateMachine";
import { GameObject } from "@/ecs/GameObject";

export class HighPriest extends Unit {
  attackTimer: number = 0;
  attackClipLength: number | undefined;
  damagePoint: number;

  constructor(gameObject: GameObject, params: UnitConstructionParams) {
    super(gameObject, params);
    this.damagePoint = params.model.damagePoint1 ?? 0.3;

    this.fsm.addStates({
      idle: {
        enter: () => this.skinInstance.playAnimation("idle"),
        update: () => {
          if (this.target != null) {
            this.fsm.transition("chase");
          }
        },
      },
      chase: {
        enter: () => this.skinInstance.playAnimation("walk"),
        update: (delta: number) => {
          if (
            this.target?.healthComponent.isAlive() &&
            !this.target.healthComponent.isOverhealed()
          ) {
            const direction = new THREE.Vector3()
              .subVectors(
                this.target.gameObject.transform.position,
                this.gameObject.transform.position
              )
              .normalize()
              .multiplyScalar(this.moveSpeed * delta);
            this.rigidbody?.move(direction);
            this.gameObject.lookAt(direction, this.forward);
          } else {
            this.target = null;
            this.fsm.transition("idle");
          }
        },
        exit: () => this.rigidbody?.move(new THREE.Vector3(0, 0, 0)),
      },
      heal: {
        enter: () => {
          this.attackTimer = 0;
          this.hasAttacked = false;
          this.skinInstance.playAnimation("cast_A");
          this.attackClipLength = this.skinInstance.getClipLength();
        },
        update: (delta: number) => {
          if (this.attackClipLength === undefined) return;
          if (this.target) {
            const vector = new THREE.Vector3().subVectors(
              this.target.gameObject.transform.position,
              this.gameObject.transform.position
            );
            this.gameObject.lookAt(vector, this.forward);
          }
          this.skinInstance.setAnimationSpeed(this.attackComponent.attackSpeed);
          this.attackTimer += delta;

          if (
            !this.hasAttacked &&
            this.attackTimer >=
              this.damagePoint *
                this.attackClipLength *
                (1 / this.attackComponent.attackSpeed)
          ) {
            this.healTarget(this.target!);
            this.hasAttacked = true;
          } else if (
            this.attackTimer >=
            this.attackClipLength * (1 / this.attackComponent.attackSpeed)
          ) {
            if (
              this.target?.healthComponent.isAlive() &&
              !this.target.healthComponent.isOverhealed()
            ) {
              this.fsm.transition("heal", true);
            } else {
              this.fsm.transition("idle");
            }
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
    });
    this.skinInstance.playAnimation("idle");
  }

  healTarget(target: Unit) {
    if (target.healthComponent?.isAlive()) {
      target.healthComponent.heal(this.attackComponent.magAttack);
    }
  }

  override canHaveTarget(otherUnit: Unit): boolean {
    return (
      otherUnit !== this &&
      this.teamId === otherUnit.teamId &&
      otherUnit.healthComponent.isAlive() &&
      !otherUnit.healthComponent.isOverhealed()
    );
  }

  update(delta: number) {
    if (!this.enabled) return;
    super.update(delta);
    if (
      this.target?.healthComponent.isOverhealed() ||
      !this.target?.healthComponent.isAlive()
    ) {
      this.target = null;
      return;
    }
    const distanceToTarget = this.target
      ? this.gameObject.transform.position.distanceTo(
          this.target.gameObject.transform.position
        )
      : Infinity;

    if (!this.healthComponent.isAlive()) {
      this.fsm.transition("death");
    } else if (distanceToTarget <= this.attackComponent.range) {
      this.fsm.transition("heal");
    } else if (this.target?.healthComponent.isAlive()) {
      this.fsm.transition("chase");
    } else {
      this.fsm.transition("idle");
    }
    this.fsm.update(delta);
  }
}
