// src/particles/BaseParticleSystem.ts
import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";
import * as THREE from "three";

// --- REVISED VERTEX SHADER ---
const vertexShader = `
  uniform float uTime;
  attribute float aStartTime;
  attribute float aDuration;
  attribute vec3 aVelocity;
  attribute float aSize;
  varying float vLifePct; // Life percentage (1.0 -> 0.0)

  void main() {
    float lifeElapsed = uTime - aStartTime;
    
    // Only process particles that are still alive
    if (lifeElapsed < aDuration && lifeElapsed >= 0.0) {
        vLifePct = 1.0 - (lifeElapsed / aDuration);
        
        vec3 newPosition = position + aVelocity * lifeElapsed;
        vec4 modelViewPosition = modelViewMatrix * vec4(newPosition, 1.0);
        
        gl_Position = projectionMatrix * modelViewPosition;
        // Size is now a simple linear fade based on life percentage
        gl_PointSize = aSize * vLifePct;
    } else {
        // Hide dead particles
        gl_Position = vec4(0.0, 0.0, 0.0, 0.0);
        vLifePct = 0.0;
    }
  }
`;

// --- REVISED FRAGMENT SHADER ---
const fragmentShader = `
  uniform vec3 uColor;
  varying float vLifePct;

  void main() {
    if (vLifePct <= 0.0) {
      discard; // Don't render dead particles
    }
    
    // The alpha is now directly the life percentage
    gl_FragColor = vec4(uColor, vLifePct);
  }
`;

export interface ParticleSystemOptions {
  color?: THREE.Color;
  blending?: THREE.Blending;
}

export abstract class BaseParticleSystem extends GameComponent {
  protected particles: THREE.Points;
  protected material: THREE.ShaderMaterial;
  protected geometry: THREE.BufferGeometry;
  protected particleCount: number;
  protected time: number = 0;
  protected particleIndex: number = 0;

  constructor(
    gameObject: GameObject,
    particleCount: number,
    options?: ParticleSystemOptions
  ) {
    super(gameObject);
    this.particleCount = particleCount;

    this.geometry = new THREE.BufferGeometry();
    // Initialize empty buffers
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3)
    );
    this.geometry.setAttribute(
      "aVelocity",
      new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3)
    );
    this.geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(new Float32Array(particleCount), 1)
    );
    // --- NEW LIFETIME ATTRIBUTES ---
    this.geometry.setAttribute(
      "aStartTime",
      new THREE.BufferAttribute(new Float32Array(particleCount), 1)
    );
    this.geometry.setAttribute(
      "aDuration",
      new THREE.BufferAttribute(new Float32Array(particleCount), 1)
    );

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: options?.color || new THREE.Color(0xffffff) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    if (options?.blending) {
      this.material.blending = options.blending;
    }

    this.particles = new THREE.Points(this.geometry, this.material);
    this.gameObject.transform.add(this.particles);
  }

  protected emitParticle(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    size: number,
    duration: number // Changed from 'life' to 'duration' for clarity
  ): void {
    const i = this.particleIndex;

    (this.geometry.attributes.position as THREE.BufferAttribute).setXYZ(
      i,
      position.x,
      position.y,
      position.z
    );
    (this.geometry.attributes.aVelocity as THREE.BufferAttribute).setXYZ(
      i,
      velocity.x,
      velocity.y,
      velocity.z
    );
    (this.geometry.attributes.aSize as THREE.BufferAttribute).setX(i, size);

    // --- SET NEW LIFETIME ATTRIBUTES ---
    (this.geometry.attributes.aStartTime as THREE.BufferAttribute).setX(
      i,
      this.time
    );
    (this.geometry.attributes.aDuration as THREE.BufferAttribute).setX(
      i,
      duration
    );

    this.particleIndex = (this.particleIndex + 1) % this.particleCount;

    // --- FLAG ATTRIBUTES FOR UPDATE ---
    // This is crucial to tell Three.js to send the new data to the GPU
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.aVelocity as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.aStartTime as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.aDuration as THREE.BufferAttribute).needsUpdate =
      true;
  }

  update(delta: number): void {
    this.time += delta;
    this.material.uniforms.uTime.value = this.time;
  }

  destroy(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.gameObject.transform.remove(this.particles);
  }
}
