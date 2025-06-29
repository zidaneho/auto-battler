import { AttackReport } from "@/stats/AttackReport";
import { GameComponent } from "../ecs/GameComponent";
import { GameObject } from "../ecs/GameObject";
import { HealthComponent } from "../stats/HealthComponent";
import { Unit } from "@/units/Unit";

import { ExplosionSystem } from "@/particles/ExplosionSystem";
import { VFXManager } from "@/particles/VFXManager";

export class ProjectileDamage extends GameComponent {
  attackReport: AttackReport;
  teamId: number;
  handler: (payload: any) => void;
  vfx?: string
  private vfxManager : VFXManager;

  constructor(
    gameObject: GameObject,
    teamId: number,
    attackReport: AttackReport,
    vfxManager:VFXManager,
    vfx?: string
  ) {
    super(gameObject);
    this.attackReport = attackReport;
    this.teamId = teamId;
    this.handler = this.handleDamage.bind(this);
    this.gameObject.on("collision", this.handler);
    this.vfx = vfx;
    this.vfxManager = vfxManager;
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
        this.onHit();
      }
    } else if (otherGO.tag === "terrain") {
      this.onHit();
    }
  }
  destroy(): void {
    this.gameObject.off("collision", this.handler);
  }

  onHit(): void {
    this.gameObject.markedForRemoval = true;
  }
}
