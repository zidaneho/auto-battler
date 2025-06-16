import { GameComponent } from "@/ecs/GameComponent";
import { SkinInstance } from "@/components/SkinInstance";
import { UnitStats } from "./UnitStats";
import * as THREE from "three";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { HealthComponent } from "@/components/HealthComponent";
import { GameObject } from "@/ecs/GameObject";
import { FiniteStateMachine } from "@/components/FiniteStateMachine";

export class Unit extends GameComponent {
  // Made Unit an abstract class
  teamId: number;
  target: Unit | null;
  unitStats: UnitStats;
  skinInstance: SkinInstance;
  healthComponent: HealthComponent;
  rigidbody?: CharacterRigidbody; //Rigidbody can be undefined
  forward: THREE.Vector3;
  hasAttacked: boolean; //added hasAttacked
  fsm: FiniteStateMachine<string>;
  //gridPosition is to save the unit's position when it gets dragged & droppped
  gridPosition:THREE.Vector3;

  constructor(gameObject: GameObject, model: any, teamId: number, spawnPosition: THREE.Vector3) {
    // Added GameObject type
    super(gameObject);

    this.gridPosition = spawnPosition;

    //a team id of 0 means it can attack anyone
    this.teamId = teamId;
    this.target = null;
    this.hasAttacked = false;

    this.unitStats = gameObject.getComponent(UnitStats)!; // ! asserts non-null
    this.skinInstance = gameObject.addComponent(SkinInstance, model);
    this.healthComponent = gameObject.getComponent(HealthComponent)!; // ! asserts non-null
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

    target.healthComponent.takeDamage(this.unitStats.attack);
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
