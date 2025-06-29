import { Unit, UnitConstructionParams } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "@/components/FiniteStateMachine";
import { GameObject } from "@/ecs/GameObject";

export class HeavySwordman extends Unit {
  attackTimer: number = 0;
  attackClipLength: number | undefined;

  constructor(gameObject: GameObject, params: UnitConstructionParams) {
    super(gameObject, params);

    this.fsm.addStates({
      idle: { enter: () => this.skinInstance.playAnimation("idle") },
      chase: {
        enter: () => this.skinInstance.playAnimation("walk"),
        update: (delta: number) => {
          if (this.target?.healthComponent.isAlive()) {
            const direction = new THREE.Vector3().subVectors(this.target.gameObject.transform.position, this.gameObject.transform.position).normalize().multiplyScalar(this.moveSpeed * delta);
            this.rigidbody?.move(direction);
            this.gameObject.lookAt(direction, this.forward);
          }
        },
      },
      attack: {
        enter: () => {
          this.attackTimer = 0;
          this.hasAttacked = false;
          this.skinInstance.playAnimation("attack_A");
          this.attackClipLength = this.skinInstance.getClipLength();
        },
        update: (delta: number) => {
          if (this.attackClipLength === undefined) return;
           if (this.target) {
            const direction = new THREE.Vector3().subVectors(this.target.gameObject.transform.position, this.gameObject.transform.position);
            this.gameObject.lookAt(direction, this.forward);
          }
          this.skinInstance.setAnimationSpeed(this.attackComponent.attackSpeed);
          this.attackTimer += delta;

          if (!this.hasAttacked && this.attackTimer >= this.damagePoint * this.attackClipLength * (1 / this.attackComponent.attackSpeed)) {
            this.dealDamage(this.target!);
          } else if (this.attackTimer >= this.attackClipLength * (1 / this.attackComponent.attackSpeed)) {
            this.fsm.transition(this.target?.healthComponent.isAlive() ? "attack" : "idle", true);
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
    if (!this.enabled) return;
    super.update(delta);
    const distanceToTarget = this.target ? this.gameObject.transform.position.distanceTo(this.target.gameObject.transform.position) : Infinity;

    if (!this.healthComponent.isAlive()) {
      this.fsm.transition("death");
    } else if (distanceToTarget <= this.attackComponent.range) {
      this.fsm.transition("attack");
    } else if (this.target?.healthComponent.isAlive()) {
      this.fsm.transition("chase");
    } else {
      this.fsm.transition("idle");
    }
    this.fsm.update(delta);
  }
}