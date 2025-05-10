import { GameComponent } from "./ecs/GameComponent";

export class HealthComponent extends GameComponent {
  constructor(gameObject, health) {
    super(gameObject);
    this.health = health;
    this.maxHealth = health;
  }

  takeDamage(damage) {
    this.health -= damage;
  }
  heal(health) {
    console.log("healed");
    this.health += health;
  }
  isAlive() {
    return this.health > 0;
  }
}
