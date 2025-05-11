// components/SkinInstance.ts
import { GameComponent } from "@/components/ecs/GameComponent";
import { GameObject } from "@/components/ecs/GameObject";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

interface Model {
  gltf: THREE.Object3D;
  animations: { [key: string]: THREE.AnimationClip };
}

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
      action.stop().reset();
      this.actions[clip.name] = action;
    }
  }

  getAction(animName: string): THREE.AnimationAction | undefined {
    return this.actions[animName];
  }

  playAnimation(animName: string, reset: boolean = false): void {
    if (this.currentAnimation === animName && !reset) {
      return;
    } else if (!(animName in this.actions)) {
      console.warn(`${animName} is not contained in animation actions`);
      return;
    }

    if (this.currentAnimation) {
      const old = this.actions[this.currentAnimation];
      if (old) {
        old.enabled = false;
        old.fadeOut(0.25);
      }
    }

    let action = this.actions[animName];
    if (!action) {
      const clip = this.model.animations[animName];
      if (clip) {
          action = this.mixer.clipAction(clip);
          this.actions[animName] = action;
      } else {
          console.warn(`Animation ${animName} not found in model animations`);
          return;
      }
    }

    action.reset();
    action.enabled = true;
    action.timeScale = 1;
    action.play();
    this.currentAnimation = animName;
  }

  getClipLength(): number | undefined {
    const action = this.actions[this.currentAnimation as string];
    if (action) {
        const clip = action.getClip();
        clip.resetDuration();
        return clip.duration;
    }
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