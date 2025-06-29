// src/particles/FireballTrailSystem.ts
import { BaseParticleSystem } from "./BaseParticleSystem";
import { GameObject } from "@/ecs/GameObject";
import * as THREE from "three";
import { TrailVFX } from "./VFXBlueprint";

export class FireballTrailSystem extends BaseParticleSystem {
  private vfx: TrailVFX;
  private lastEmitTime: number = 0;

  constructor(gameObject: GameObject, vfx: TrailVFX) {
    // Pass common options (color, blending) up to the base class
    super(gameObject, vfx.particleCount, {
      color: vfx.color,
      blending: vfx.blending,
    });
    this.vfx = vfx;
  }

  update(delta: number): void {
    super.update(delta);

    // Check if it's time to emit a new particle based on the emitRate
    if (this.time - this.lastEmitTime > 1.0 / this.vfx.emitRate) {
      // Give the particle a slight, random velocity for a "smoky" or "ember-like" look
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      // Use the size and life ranges from the VFX data
      const size = THREE.MathUtils.randFloat(
        this.vfx.size.min,
        this.vfx.size.max
      );
      const life = THREE.MathUtils.randFloat(
        this.vfx.life.min,
        this.vfx.life.max
      );

      // Emit the particle at the projectile's current position (the center of the particle system)
      this.emitParticle(new THREE.Vector3(0, 0, 0), velocity, size, life);
      this.lastEmitTime = this.time;
    }
  }
}
