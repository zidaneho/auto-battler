import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";
import { HealthComponent } from "../HealthComponent";
import { Unit } from "../units/Unit";

export class ProjectileDamage extends GameComponent {
  damage: number;
  teamId: number;

  constructor(gameObject: GameObject, teamId: number, damage: number) {
    super(gameObject);
    this.damage = damage;
    this.teamId = teamId;

    this.gameObject.on("collision", ({ otherGO, started }) => {
      if (!started || !otherGO) return;
      if (otherGO.tag === "unit") {
        const otherUnit = otherGO.getComponent(Unit);
        if (otherUnit && otherUnit.teamId !== this.teamId) {
          otherUnit.healthComponent.takeDamage(this.damage);
          this.gameObject.markedForRemoval = true;
        }
      } else if (otherGO.tag === "terrain") {
        this.gameObject.markedForRemoval = true;
      }
    });
  }
}
