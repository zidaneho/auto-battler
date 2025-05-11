import { Unit } from "./Unit";
import * as THREE from "three";
import { FiniteStateMachine } from "../FiniteStateMachine";
import { ProjectileManager } from "../projectiles/ProjectileManager";
import { loadedModels, models } from "../meshes/ModelList";
import { Vector3 } from "three";
import { GameObject } from "../ecs/GameObject";

export class Archer extends Unit {
  projectileManager: ProjectileManager;
  projectileSpawnPoint: Vector3;
  hasAttacked: boolean = false;
  attackTimer: number = 0;
  attackClipLength: number | undefined;
  damagePoint: number;
  fsm: FiniteStateMachine<string>;

  constructor(
    gameObject: GameObject,
    model: any,
    teamId: number,
    projectileManager: ProjectileManager,
    projectileSpawnPoint: Vector3
  ) {
    super(gameObject, model, teamId);

    const deathAction = this.skinInstance.getAction("death_A");
    if (deathAction) {
      deathAction.clampWhenFinished = true;
      deathAction.setLoop(THREE.LoopOnce, 1);
    }
    this.damagePoint = model.damagePoint1;
    this.projectileManager = projectileManager;
    this.projectileSpawnPoint = projectileSpawnPoint;

    const fsm = new FiniteStateMachine<string>(
      {
        idle: {
          enter: () => {
            this.skinInstance.playAnimation("idle");
          },
          update: (delta: number) => {
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
            if (this.target != null && this.target.healthComponent.isAlive()) {
              const result = new THREE.Vector3();
              const vector = result.subVectors(
                this.target.gameObject.transform.position,
                this.gameObject.transform.position
              );

              if (vector.length() <= 10) {
                this.fsm.transition("attack");
              }

              vector.normalize();
              vector.multiplyScalar(this.unitStats.moveSpeed * delta);

              this.rigidbody?.move(vector);
              this.gameObject.lookAt(vector, this.forward);
            } else {
              this.fsm.transition("idle");
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
              this.hasAttacked = true;
              const result = new THREE.Vector3();
              const vector = result.subVectors(
                this.target.gameObject.transform.position,
                this.gameObject.transform.position
              );
              const model = loadedModels.arrow1;
              const scene = new THREE.Object3D();
              if (model.gltf !== undefined) {
                this.projectileManager.createProjectile(
                  this.getArrowSpawnPoint(),
                  model,
                  15,
                  vector,
                  this.teamId,
                  50
                );
              }
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

  update(delta: number) {
    super.update(delta);
    if (this.healthComponent && !this.healthComponent.isAlive()) {
      this.fsm.transition("death");
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
