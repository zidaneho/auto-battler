import * as THREE from 'three';

// Define the types of particle emitters we have
export enum VFX_EMITTER_TYPE {
    BURST = 'burst',   // An instant explosion of particles
    TRAIL = 'trail',   // A continuous stream of particles
}

// The blueprint for a "burst" or "explosion" effect
export interface BurstVFX {
    type: VFX_EMITTER_TYPE.BURST;
    particleCount: number;
    lifetime: number; // How long the whole effect lasts
    color: THREE.Color;
    size: { min: number; max: number };
    velocityMagnitude: number;
    blending?: THREE.Blending;
    map?: THREE.Texture | null;
}

// The blueprint for a "trail" effect
export interface TrailVFX {
    type: VFX_EMITTER_TYPE.TRAIL;
    particleCount: number; // The particle pool size
    emitRate: number;      // Particles per second
    color: THREE.Color;
    size: { min: number; max: number };
    life: { min: number; max: number }; // Lifetime of each particle
    blending?: THREE.Blending;
    map?: THREE.Texture | null;
}

// A union type that can be either a burst or a trail
export type VFXBlueprint = BurstVFX | TrailVFX;