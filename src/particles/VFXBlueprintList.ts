import * as THREE from 'three';
import { VFXBlueprint, VFX_EMITTER_TYPE } from './VFXBlueprint';

// We can load the texture once and reference it here
const particleTexture = new THREE.TextureLoader().load("/textures/particle.png");

export const VFXLibrary: Record<string, VFXBlueprint> = {

    "fireball_explosion": {
        type: VFX_EMITTER_TYPE.BURST,
        particleCount: 150,
        lifetime: 1.5,
        color: new THREE.Color(0xff4500),
        size: { min: 1, max: 8 },
        velocityMagnitude: 5,
        blending: THREE.AdditiveBlending,
        map: particleTexture,
    },

    "fireball_trail": {
        type: VFX_EMITTER_TYPE.TRAIL,
        particleCount: 200,
        emitRate: 80,
        color: new THREE.Color(0xff4500),
        size: { min: 1, max: 4 },
        life: { min: 0.5, max: 1.2 },
        blending: THREE.AdditiveBlending,
        map: particleTexture,
    },

    "blood_splatter": {
        type: VFX_EMITTER_TYPE.BURST,
        particleCount: 100,
        lifetime: 0.8,
        color: new THREE.Color(0x880808), // Dark red
        size: { min: 0.5, max: 1.5 },
        velocityMagnitude: 4,
        map: particleTexture,
    },

    "footstep_dust": {
        type: VFX_EMITTER_TYPE.BURST,
        particleCount: 20,
        lifetime: 1.0,
        color: new THREE.Color(0x966F33), // Brown
        size: { min: 0.5, max: 1.0 },
        velocityMagnitude: 0.5, // A slow poof
        map: particleTexture,
    },
};