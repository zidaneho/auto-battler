import { GameComponent } from "./ecs/GameComponent"

export class UnitStats extends GameComponent {
    constructor(gameObject, health, attack, moveSpeed) {
        super(gameObject);
        this.health = health;
        this.attack = attack;
        this.moveSpeed = moveSpeed;


    }
}