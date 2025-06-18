import { AttackReport } from "@/stats/AttackReport";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";
import { HealthComponent } from "../stats/HealthComponent";
import { Unit } from "@/units/Unit";

export class ProjectileDamage extends GameComponent {
  attackReport : AttackReport
  teamId: number;

  constructor(gameObject: GameObject, teamId: number, attackReport:AttackReport) {
    super(gameObject);
    this.attackReport = attackReport;
    this.teamId = teamId;

    this.gameObject.on("collision", ({ otherGO, started }) => {
      if (!started || !otherGO) return;
      if (otherGO.tag === "unit") {
        const otherUnit = otherGO.getComponent(Unit);
        if (otherUnit && otherUnit.teamId !== this.teamId) {
          otherUnit.healthComponent.takeDamage(attackReport);
          this.gameObject.markedForRemoval = true;
        }
      } else if (otherGO.tag === "terrain") {
        this.gameObject.markedForRemoval = true;
      }
    });
  }
}
