import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";
import * as THREE from "three";

const vertexShader = `
  uniform float uTime;
  attribute vec3 aVelocity;
  attribute float aRotation;
  attribute float aSize;
  attribute float aLife;
  varying float vLife;

  void main() {
    vLife = aLife - uTime;
    if (vLife > 0.0) {
      vec3 newPosition = position + aVelocity * uTime;
      vec4 modelViewPosition = modelViewMatrix * vec4(newPosition, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
      gl_PointSize = aSize * (1.0 - (uTime / aLife));
    } else {
      gl_Position = vec4(0.0, 0.0, 0.0, 0.0);
    }
  }
`;
const fragmentShader = `
  uniform vec3 uColor;
  varying float vLife;

  void main() {
    if (vLife <= 0.0) {
      discard;
    }
    float alpha = vLife / 1.0; // Fade out over 1 second
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export class CustomParticleSystem extends GameComponent {
  private particles: THREE.Points;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private particleCount: number;
  private lifetime: number;
  private time: number = 0;

  constructor(gameObject: GameObject, particleCount: number, lifetime: number) {
    super(gameObject);
    this.particleCount = particleCount;
    this.lifetime = lifetime;

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const lives = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions.set([0, 0, 0], i * 3);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      velocities.set([velocity.x, velocity.y, velocity.z], i * 3);

      sizes[i] = Math.random() * 5 + 2;
      lives[i] = Math.random() * lifetime + 1.0;
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute(
      "aVelocity",
      new THREE.BufferAttribute(velocities, 3)
    );
    this.geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute("aLife", new THREE.BufferAttribute(lives, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xff4500) }, // Fireball orange
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.gameObject.transform.add(this.particles);
  }

  update(delta: number): void {
    this.time += delta;
    this.material.uniforms.uTime.value = this.time;

    if (this.time > this.lifetime + 2.0) {
      // A little buffer for particles to die
      this.gameObject.markedForRemoval = true;
    }
  }

  destroy(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.gameObject.transform.remove(this.particles);
  }
}
