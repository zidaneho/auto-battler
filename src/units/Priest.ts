import { Unit, UnitConstructionParams } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "@/components/FiniteStateMachine";
import { HealthComponent } from "@/stats/HealthComponent";
import { GameObject } from "@/ecs/GameObject";
import { AttackDef } from "@/units/UnitBlueprint";

export class Priest extends Unit {
  hasAttacked: boolean = false;
  attackTimer: number = 0;
  attackClipLength: number | undefined;
  damagePoint: number;

  constructor(
    gameObject: GameObject,
    params:UnitConstructionParams
  ) {
    super(gameObject, params);

    const deathAction = this.skinInstance.getAction("death_A");
    if (deathAction) {
      deathAction.clampWhenFinished = true;
      deathAction.setLoop(THREE.LoopOnce, 1);
    }
    this.damagePoint = params.model.damagePoint1!;

    this.fsm.addStates({
      idle: {
        enter: () => {
          this.skinInstance.playAnimation("idle");
        },
        update: () => {
          if (this.target != null) {
            this.fsm.transition("chase");
          }
        },
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
            const direction = result
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
        exit: () => {
          this.rigidbody?.move(new THREE.Vector3(0, 0, 0));
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
            this.target != null &&
            !this.hasAttacked &&
            this.attackTimer >=
              this.damagePoint *
                this.attackClipLength *
                (1 / this.attackComponent.attackSpeed)
          ) {
            this.healTarget(this.target);
            this.hasAttacked = true;
          } else if (
            this.attackTimer >=
            this.attackClipLength * (1 / this.attackComponent.attackSpeed)
          ) {
            // If the target still needs healing, keep healing
            if (
              this.target != null &&
              this.target.healthComponent.isAlive() &&
              !this.target.healthComponent.isOverhealed()
            ) {
              this.fsm.transition("heal");
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
        },
      },
    });

    this.skinInstance.playAnimation("idle");
  }

  healTarget(target: Unit) {
    if (target.healthComponent != null && target.healthComponent.isAlive()) {
      target.healthComponent.heal(this.healthComponent.healingPower);
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

    const vector =
      this.target != null && this.target.healthComponent.isAlive()
        ? new THREE.Vector3().subVectors(
            this.target.gameObject.transform.position,
            this.gameObject.transform.position
          )
        : new THREE.Vector3(100, 100, 100);

    super.update(delta);
    if (
      this.target?.healthComponent.isOverhealed() ||
      !this.target?.healthComponent.isAlive()
    ) {
      this.target = null;
      return;
    }

    if (this.healthComponent && !this.healthComponent.isAlive()) {
      this.fsm.transition("death");
    } else if (vector.length() <= 4) {
      this.fsm.transition("heal");
    } else if (this.target && this.target.healthComponent.isAlive()) {
      this.fsm.transition("chase");
    } else {
      this.fsm.transition("idle");
    }

    this.fsm.update(delta);
  }
}
