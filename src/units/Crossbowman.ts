import { Unit, UnitConstructionParams } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "@/components/FiniteStateMachine";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { Vector3 } from "three";
import { GameObject } from "@/ecs/GameObject";
import { useModelStore } from "@/components/ModelStore";
import { GameConfig } from "@/components/GlobalsConfig";

export class Crossbowman extends Unit {
  projectileManager: ProjectileManager;
  projectileSpawnPoint: Vector3;
  hasAttacked: boolean = false;
  attackTimer: number = 0;
  attackClipLength: number | undefined;
  damagePoint: number;

  constructor(gameObject: GameObject, params: UnitConstructionParams) {
    super(gameObject, params);

    this.damagePoint = params.model.damagePoint1 ?? 0.3;
    this.projectileManager = params.projectileManager!;
    this.projectileSpawnPoint =
      params.projectileSpawnPoint ?? new THREE.Vector3(0, 1.2, 0.5);

    this.fsm.addStates({
      idle: { enter: () => this.skinInstance.playAnimation("idle") },
      chase: {
        enter: () => this.skinInstance.playAnimation("walk"),
        update: (delta: number) => {
          if (this.target?.healthComponent.isAlive()) {
            const direction = new THREE.Vector3()
              .subVectors(
                this.target.gameObject.transform.position,
                this.gameObject.transform.position
              )
              .normalize()
              .multiplyScalar(this.moveSpeed * delta);
            this.rigidbody?.move(direction);
            this.gameObject.lookAt(direction, this.forward);
          }
        },
        exit: () => this.rigidbody?.move(new Vector3(0, 0, 0)),
      },
      attack: {
        enter: () => {
          this.attackTimer = 0;
          this.hasAttacked = false;
          this.skinInstance.setAnimationSpeed(this.attackComponent.attackSpeed);
          this.skinInstance.playAnimation("attack_A");
          const rawClipLength = this.skinInstance.getClipLength();
          this.attackClipLength =
            rawClipLength * (1 / this.attackComponent.attackSpeed);
          if (this.target) {
            const direction = new THREE.Vector3().subVectors(
              this.target.gameObject.transform.position,
              this.gameObject.transform.position
            );
            this.gameObject.lookAt(direction, this.forward);
          }
        },
        update: (delta: number) => {
          if (this.attackClipLength === undefined) return;
          this.attackTimer += delta;

          if (
            !this.hasAttacked &&
            this.attackTimer >= this.damagePoint * this.attackClipLength
          ) {
            this.hasAttacked = true;
            const boltModel = useModelStore
              .getState()
              .getModel("crossbow_bolt"); // Assuming a projectile model key
            if (boltModel && this.target) {
              this.projectileManager.createProjectile(
                this.getProjectileSpawnPoint(),
                boltModel,
                15, // Faster than an arrow
                0.1,
                GameConfig.gravityScalar,
                this.target.rigidbody?.getCorePosition() ??
                  this.target.gameObject.transform.position,
                this.teamId,
                this.attackComponent.getAttackReport(
                  this.attackDef.power,
                  this.attackDef.accuracy,
                  "physical",
                  this.target.evasion
                ),
                8
              );
            }
          } else if (this.attackTimer >= this.attackClipLength) {
            this.fsm.transition(
              this.target?.healthComponent.isAlive() ? "attack" : "idle",
              true
            );
          }
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
    const distanceToTarget = this.target
      ? this.gameObject.transform.position.distanceTo(
          this.target.gameObject.transform.position
        )
      : Infinity;

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

  getProjectileSpawnPoint(): Vector3 {
    const offset = this.projectileSpawnPoint
      .clone()
      .applyQuaternion(this.gameObject.transform.quaternion);
    return new Vector3().addVectors(this.gameObject.transform.position, offset);
  }
}
