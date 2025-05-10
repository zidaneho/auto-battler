import { GameComponent } from "@/components/ecs/GameComponent";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import * as THREE from "three";

export class SkinInstance extends GameComponent {
  constructor(gameObject, model) {
    super(gameObject);
    this.model = model;
    this.animRoot = SkeletonUtils.clone(this.model.gltf.scene);
    this.mixer = new THREE.AnimationMixer(this.animRoot);
    gameObject.transform.add(this.animRoot);
    this.actions = {};
    this.currentAnimation = null;

    for (const clip of Object.values(this.model.animations)) {
      const action = this.mixer.clipAction(clip);
      action.stop().reset();
      this.actions[clip.name] = action;
    }
  }
  getAction(animName) {
    return this.actions[animName];
  }
 
  playAnimation(animName, reset = false) {
    if (this.currentAnimation == animName && !reset) {
      return;
    } else if (!(animName in this.actions)) {
      return;
    }

    if (this.currentAnimation) {
      const old = this.actions[this.currentAnimation];
      old.enabled = false;
      old.fadeOut(0.25);
    }

    let action = this.actions[animName];
    if (!action) {
      // first time we see this clip, create & cache it
      const clip = this.model.animations[animName];
      action = this.mixer.clipAction(clip);
      this.actions[animName] = action;
    }

    // reset + play
    action.reset();
    action.enabled = true;
    action.timeScale = 1;
    action.play();
    this.currentAnimation = animName;
  }
  getClipLength() {
    const action = this.actions[this.currentAnimation];
    const clip = action.getClip();
    clip.resetDuration();
    return clip.duration;
  }
  setAnimationSpeed(speed) {
    const action = this.actions[this.currentAnimation];
    action.timeScale = speed;
  }
  update(delta) {
    this.mixer.update(delta);
  }
}
