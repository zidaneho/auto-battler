// src/particles/ExplosionSystem.ts (Formerly particleSystem.ts)
import { BaseParticleSystem } from "./BaseParticleSystem";
import { GameObject } from "@/ecs/GameObject";
import * as THREE from "three";
import { BurstVFX } from "./VFXBlueprint";

export class ExplosionSystem extends BaseParticleSystem {
  private totalLifetime: number;

  constructor(gameObject: GameObject, vfx: BurstVFX) {
    super(gameObject, vfx.particleCount, {
      color: vfx.color,
      blending: vfx.blending,
    });
    this.totalLifetime = vfx.lifetime;
    this.material.uniforms.uColor.value = new THREE.Color(0xff4500); // Orange color

    // "Burst" logic
    for (let i = 0; i < vfx.particleCount; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      );
      const size = Math.random() * 5 + 2;
      const life = Math.random() * vfx.lifetime + 0.5;
      this.emitParticle(new THREE.Vector3(0, 0, 0), velocity, size, life);
    }
  }

  update(delta: number): void {
    super.update(delta);
    // Remove after the effect is finished
    if (this.time > this.totalLifetime + 1.0) {
      this.gameObject.markedForRemoval = true;
    }
  }
}
