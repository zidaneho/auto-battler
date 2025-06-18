import { Unit } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "@/components/FiniteStateMachine";
import { GameObject } from "@/ecs/GameObject";
import { AttackDef } from "@/components/UnitBlueprint";

export class Knight extends Unit {
  hasAttacked: boolean = false;
  attackTimer: number = 0;
  attackClipLength: number | undefined;
  damagePoint: number;

  constructor(
    gameObject: GameObject,
    model: any,
    teamId: number,
    spawnPosition: THREE.Vector3,
    attackDef:AttackDef
  ) {
    super(gameObject, model, teamId, spawnPosition,attackDef);

    const deathAction = this.skinInstance.getAction("death_A");
    if (deathAction) {
      deathAction.clampWhenFinished = true;
      deathAction.setLoop(THREE.LoopOnce, 1);
    }

    this.damagePoint = model.damagePoint1;

    this.fsm.addStates({
      idle: {
        enter: () => {
          this.skinInstance.playAnimation("idle");
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
            vector.normalize();
            vector.multiplyScalar(this.moveSpeed * delta);

            this.rigidbody?.move(vector);
            this.gameObject.lookAt(vector, this.forward);
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

          if (this.target != null && this.target.healthComponent.isAlive()) {
            const result = new THREE.Vector3();
            const vector = result.subVectors(
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
            this.dealDamage(this.target);
          } else if (
            this.attackTimer >=
            this.attackClipLength * (1 / this.attackComponent.attackSpeed)
          ) {
            if (this.target != null && this.target.healthComponent.isAlive()) {
              this.fsm.transition("attack", true);
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

  update(delta: number) {
    if (!this.enabled) {
      return;
    }
    super.update(delta);

    const vector =
      this.target != null
        ? new THREE.Vector3().subVectors(
            this.target.gameObject.transform.position,
            this.gameObject.transform.position
          )
        : new THREE.Vector3(100, 100, 100);

    if (this.healthComponent && !this.healthComponent.isAlive()) {
      this.fsm.transition("death");
    } else if (vector.length() <= 1.5) {
      this.fsm.transition("attack");
    } else if (this.target != null && this.target.healthComponent.isAlive()) {
      this.fsm.transition("chase");
    } else {
      this.fsm.transition("idle");
    }
    this.fsm.update(delta);
  }
}
