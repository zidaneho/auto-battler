import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";

export class UnitStats extends GameComponent {
  health: number;
  attack: number;
  moveSpeed: number;
  healingPower: number;

  constructor(
    gameObject: GameObject,
    health: number,
    attack: number,
    moveSpeed: number,
    healingPower: number
  ) {
    super(gameObject);
    this.health = health;
    this.attack = attack;
    this.moveSpeed = moveSpeed;
    this.healingPower = healingPower;
  }
}
