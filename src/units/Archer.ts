import { Unit, UnitConstructionParams } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "@/components/FiniteStateMachine";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { Vector3 } from "three";
import { GameObject } from "@/ecs/GameObject";
import { useModelStore } from "@/components/ModelStore";
import { GameConfig } from "@/components/GlobalsConfig";
import { AttackDef, UnitBlueprint } from "@/units/UnitBlueprint";

export class Archer extends Unit {
  projectileManager: ProjectileManager;
  projectileSpawnPoint: Vector3;
  hasAttacked: boolean = false;
  attackTimer: number = 0;
  attackClipLength: number | undefined;
  damagePoint: number;

  constructor(gameObject: GameObject, params: UnitConstructionParams) {
    super(gameObject, params);


    this.damagePoint = params.model.damagePoint1!;
    this.projectileManager = params.projectileManager!;
    this.projectileSpawnPoint = params.projectileSpawnPoint!;

    this.fsm.addStates({
      idle: {
        enter: () => {
          this.skinInstance.playAnimation("idle");
        },
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
        exit: () => {
          this.rigidbody?.move(new Vector3(0, 0, 0));
        },
      },
      attack: {
        enter: () => {
          this.attackTimer = 0;
          this.hasAttacked = false;

          this.skinInstance.setAnimationSpeed(this.attackComponent.attackSpeed);
          this.skinInstance.playAnimation("attack_A");

          const rawClipLength = this.skinInstance.getClipLength(); // unscaled by attackSpeed
          this.attackClipLength =
            rawClipLength * (1 / this.attackComponent.attackSpeed);

          if (this.target != null) {
            const result = new THREE.Vector3();
            const vector = result.subVectors(
              this.target.gameObject.transform.position,
              this.gameObject.transform.position
            );
            vector.normalize();
            this.gameObject.lookAt(vector, this.forward);
          }
        },
        update: (delta: number) => {
          if (this.attackClipLength === undefined) {
            return;
          }
          this.skinInstance.setAnimationSpeed(this.attackComponent.attackSpeed);
          this.attackTimer += delta;

          if (
            this.target != null &&
            !this.hasAttacked &&
            this.attackTimer >= this.damagePoint * this.attackClipLength
          ) {
            this.hasAttacked = true;
            const arrowModelData = useModelStore.getState().getModel("arrow1"); //

            // const scene = new THREE.Object3D(); // This line seems incorrect, ProjectileManager handles scene
            if (arrowModelData !== undefined && this.target != null) {
              // Check if model is actually loaded
              const targetPos = this.target.rigidbody
                ? this.target.rigidbody.getCorePosition()
                : this.target.gameObject.transform.position;
              this.projectileManager.createProjectile(
                this.getArrowSpawnPoint(),
                arrowModelData, // Pass the loaded Model data
                12, // projectile speed
                0.1,
                GameConfig.gravityScalar,
                targetPos,
                this.teamId,
                this.attackComponent.getAttackReport(
                  this.attackDef.power,
                  this.attackDef.accuracy,
                  this.attackDef.attackType,
                  this.target.evasion
                ),
                10
              );
            } else {
              console.warn("Arrow model 'arrow1' not found in store.");
            }
          } else if (this.attackTimer >= this.attackClipLength) {
            if (this.target != null && this.target.healthComponent.isAlive()) {
              this.fsm.transition("attack", true);
            } else {
              this.fsm.transition("idle");
            }
          }
        },
        exit: () => {},
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
        : new THREE.Vector3(Infinity, Infinity, Infinity);

    if (this.healthComponent && !this.healthComponent.isAlive()) {
      this.fsm.transition("death");
    } else if (vector.length() <= 10) {
      this.fsm.transition("attack");
    } else if (this.target != null && this.target.healthComponent.isAlive()) {
      this.fsm.transition("chase");
    } else {
      this.fsm.transition("idle");
    }
    this.fsm.update(delta);
  }
  getArrowSpawnPoint(): Vector3 {
    const offset = this.projectileSpawnPoint
      .clone()
      .applyQuaternion(this.gameObject.transform.quaternion);
    const position = this.gameObject.transform.position;
    offset.add(position);
    return offset;
  }
}
