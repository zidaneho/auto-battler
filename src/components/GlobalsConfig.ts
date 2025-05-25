import * as THREE from "three";
// GameConfig.ts

export const GameConfig = {
    gravity: new THREE.Vector3(0, -9.81, 0), // Vector form for Rapier
    gravityScalar: 9.81, // Scalar for ballistic math
  };