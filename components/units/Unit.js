import { GameComponent } from "@/components/ecs/GameComponent";
import { SkinInstance } from "@/components/SkinInstance";
import { UnitStats } from "./UnitStats";
import * as THREE from "three";
import { CharacterRigidbody } from "../physics/CharacterRigidbody";
import { HealthComponent } from "../HealthComponent";

export class Unit extends GameComponent {
  constructor(gameObject, model, teamId) {
    super(gameObject);

    //a team id of 0 means it can attack anyone
    this.teamId = teamId;
    this.target = null;
    this.attackSpeed = 1;

    this.unitStats = gameObject.getComponent(UnitStats);
    this.unitStats.attack = 50;
    this.unitStats.healingPower = 4;

    this.skinInstance = gameObject.addComponent(SkinInstance, model);
    this.healthComponent = gameObject.getComponent(HealthComponent);

    this.rigidbody = gameObject.getComponent(CharacterRigidbody);

    this.forward = new THREE.Vector3(0, 0, 1);
  }

  update(delta) {
    if (this.target != null && !this.target.healthComponent.isAlive()) {
      this.target = null;
    }
  }
  dealDamage(target) {
    if (target == null) {
      return;
    }

    target.healthComponent.takeDamage(this.unitStats.attack);
    this.hasAttacked = true;
  }
  //a function that should be overridden by unique classes
  canHaveTarget(otherUnit) {
    return otherUnit !== this && this.teamId !== otherUnit.teamId && otherUnit.healthComponent.health > 0;
  }
}
