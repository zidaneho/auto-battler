// components/SkinInstance.ts
import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

interface Model {
  gltf: THREE.Object3D;
  animations: { [key: string]: THREE.AnimationClip };
}

// --- NEW ---
// A list of animation names that should not loop by default.
const NON_LOOPING_ANIMS = new Set(['attack_A', 'attack_B', 'death_A', 'cast_A', 'cast_B']);


export class SkinInstance extends GameComponent {
  model: Model;
  animRoot: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  actions: { [key: string]: THREE.AnimationAction };
  currentAnimation: string | null = null;

  constructor(gameObject: GameObject, model: Model) {
    super(gameObject);
    this.model = model;
    this.animRoot = SkeletonUtils.clone(this.model.gltf) as THREE.Object3D;
    this.mixer = new THREE.AnimationMixer(this.animRoot);
    gameObject.transform.add(this.animRoot);
    this.actions = {};

    for (const clip of Object.values(this.model.animations)) {
      const action = this.mixer.clipAction(clip);
      
      // --- MODIFIED ---
      // Check if the animation name is in our set of non-looping animations.
      if (NON_LOOPING_ANIMS.has(clip.name)) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true; // Prevents the model from snapping back to a default pose
      }
      
      action.stop().reset();
      this.actions[clip.name] = action;
    }
  }

  getAction(animName: string): THREE.AnimationAction | undefined {
    return this.actions[animName];
  }

  playAnimation(animName: string, reset: boolean = false): void {
    if (this.currentAnimation === animName && !reset) return;
    if (!(animName in this.actions)) {
      console.warn(`${animName} is not contained in animation actions`);
      return;
    }

    const prevAction = this.currentAnimation
      ? this.actions[this.currentAnimation]
      : null;
    const nextAction = this.actions[animName];

    if (!nextAction) {
      console.warn(`Animation ${animName} not found`);
      return;
    }

    if (reset) nextAction.reset();

    nextAction.enabled = true;
    nextAction.play();

    if (prevAction && prevAction !== nextAction) {
      nextAction.reset().setEffectiveWeight(1).fadeIn(0.1);
      prevAction.crossFadeTo(nextAction, 0.1, false);
    } else {
      nextAction.reset().setEffectiveWeight(1).fadeIn(0.1);
    }

    this.currentAnimation = animName;
  }

  getClipLength(): number {
    const action = this.actions[this.currentAnimation as string];
    if (action) {
      const clip = action.getClip();
      clip.resetDuration();
      return clip.duration;
    }
    return 0;
  }

  setAnimationSpeed(speed: number): void {
    const action = this.actions[this.currentAnimation as string];
    if (action) {
      action.timeScale = speed;
    }
  }

  update(delta: number): void {
    this.mixer.update(delta);
  }
}