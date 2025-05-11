// components/HealthComponent.ts
import { GameComponent } from "./ecs/GameComponent";
import { GameObject } from "./ecs/GameObject";

export class HealthComponent extends GameComponent {
  health: number;
  maxHealth: number;

  constructor(gameObject: GameObject, health: number) {
    super(gameObject);
    this.health = health;
    this.maxHealth = health * 2;
  }

  takeDamage(damage: number): void {
    this.health -= damage;
  }

  heal(health: number): void {
    this.health += health;
  }

  isAlive(): boolean {
    return this.health > 0;
  }
}