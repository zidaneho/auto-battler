import { AttackReport } from "@/stats/AttackReport";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";
import { HealthComponent } from "../stats/HealthComponent";
import { Unit } from "@/units/Unit";

export class ProjectileDamage extends GameComponent {
  attackReport: AttackReport;
  teamId: number;
  handler: (payload: any) => void;

  constructor(
    gameObject: GameObject,
    teamId: number,
    attackReport: AttackReport
  ) {
    super(gameObject);
    this.attackReport = attackReport;
    this.teamId = teamId;
    this.handler = this.handleDamage.bind(this);
    this.gameObject.on("collision", this.handler);
  }
  handleDamage({
    otherGO,
    started,
  }: {
    otherGO: GameObject;
    started: boolean;
  }) {
    
    if (!started || !otherGO) return;
    if (otherGO.tag === "unit") {
      const otherUnit = otherGO.getComponent(Unit);
      if (otherUnit && otherUnit.teamId !== this.teamId) {
        otherUnit.healthComponent.takeDamage(this.attackReport);
        this.gameObject.markedForRemoval = true;
      }
    } else if (otherGO.tag === "terrain") {
      this.gameObject.markedForRemoval = true;
    }
  }
  destroy(): void {
    this.gameObject.off("collision", this.handler);
  }
}
