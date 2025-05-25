import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";

export class UnitStats extends GameComponent {
  health: number;
  maxHealth:number;
  attack: number;
  moveSpeed: number;
  healingPower: number;
  attackSpeed:number;



  constructor(
    gameObject: GameObject,
    health: number = 1,
    attack: number = 1,
    attackSpeed:number=1,
    moveSpeed: number = 1,
    healingPower: number = 0
  ) {
    super(gameObject);
    this.health = health;
    this.maxHealth = health;
    this.attack = attack;
    this.moveSpeed = moveSpeed;
    this.healingPower = healingPower;
    this.attackSpeed = attackSpeed
  }
}
