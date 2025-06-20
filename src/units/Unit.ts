import { GameComponent } from "@/ecs/GameComponent";
import { SkinInstance } from "@/components/SkinInstance";
import { UnitStats } from "@/units/UnitStats";
import * as THREE from "three";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { HealthComponent } from "@/stats/HealthComponent";
import { GameObject } from "@/ecs/GameObject";
import { FiniteStateMachine } from "@/components/FiniteStateMachine";
import { AttackComponent } from "@/stats/AttackComponent";
import { BuffComponent } from "../stats/BuffComponent";
import { AttackDef } from "@/units/UnitBlueprint";

export class Unit extends GameComponent {
  // Made Unit an abstract class
  teamId: number;
  target: Unit | null;
  stats: UnitStats;
  attackDef: AttackDef;
  attackComponent: AttackComponent;
  dirtyStats: boolean = true;
  buffComponent: BuffComponent;
  skinInstance: SkinInstance;
  healthComponent: HealthComponent;
  rigidbody?: CharacterRigidbody; //Rigidbody can be undefined
  forward: THREE.Vector3;
  hasAttacked: boolean; //added hasAttacked
  fsm: FiniteStateMachine<string>;
  //gridPosition is to save the unit's position when it gets dragged & droppped
  gridPosition: THREE.Vector3;
  moveSpeed: number;
  evasion: number;

  constructor(
    gameObject: GameObject,
    model: any,
    teamId: number,
    spawnPosition: THREE.Vector3,
    attackDef: AttackDef
  ) {
    // Added GameObject type
    super(gameObject);

    this.gridPosition = spawnPosition;

    //a team id of 0 means it can attack anyone
    this.teamId = teamId;
    this.target = null;
    this.hasAttacked = false;

    this.attackDef = attackDef;

    this.stats = gameObject.getComponent(UnitStats)!; // ! asserts non-null
    this.skinInstance = gameObject.addComponent(SkinInstance, model);

    this.healthComponent = gameObject.addComponent(
      HealthComponent,
      this.stats.maxHealth,
      this.stats.baseArmor,
      this.stats.baseMagArmor
    ); // ! asserts non-null
    this.attackComponent = gameObject.addComponent(
      AttackComponent,
      this.stats.baseAttack,
      this.stats.baseAttackSpeed,
      this.stats.baseCritChance,
      this.stats.baseAttackRange
    );
    this.buffComponent = gameObject.addComponent(BuffComponent);
    this.moveSpeed = this.stats.baseMoveSpeed;
    this.evasion = this.stats.baseEvasion;
    this.rigidbody = gameObject.getComponent(CharacterRigidbody);

    this.forward = new THREE.Vector3(0, 0, 1);

    this.fsm = new FiniteStateMachine<string>(
      {
        sleep: {
          //dummy state units enter when initializing.
        },
      },
      "sleep"
    );
  }

  update(delta: number): void {
    // Added delta parameter
    if (
      this.target != null &&
      this.healthComponent &&
      !this.target.healthComponent.isAlive()
    ) {
      this.target = null;
    }
  }

  dealDamage(target: Unit): void {
    // Added target parameter
    if (target == null) {
      return;
    }
    const attackReport = this.attackComponent.getAttackReport(
      this.attackDef.power,
      this.attackDef.accuracy,
      this.attackDef.attackType,
      target.evasion
    );
    target.healthComponent.takeDamage(attackReport);
    this.hasAttacked = true;
  }
  //a function that should be overridden by unique classes
  canHaveTarget(otherUnit: Unit): boolean {
    // Added otherUnit parameter and return type
    return (
      otherUnit !== this &&
      this.teamId !== otherUnit.teamId &&
      otherUnit.healthComponent.health > 0
    );
  }
}
