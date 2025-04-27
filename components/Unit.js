import { GameComponent } from "@/components/ecs/GameComponent";
import { SkinInstance } from "@/components/SkinInstance";
import { FiniteStateMachine } from "./FiniteStateMachine";
import { KinematicBody } from "./KinematicBody";
import { CapsuleCollider } from "./CapsuleCollider";

export class Unit extends GameComponent {
  constructor(gameObject, model, physics_world) {
    super(gameObject);
    this.skinInstance = gameObject.addComponent(SkinInstance, model);
    this.skinInstance.setAnimation("shield_02_walk");

    const collider = gameObject.addComponent(CapsuleCollider, 1, 0.3);
    this.collider = collider;

    this.kinematicBody = gameObject.addComponent(
      KinematicBody,
      physics_world,
      collider.description
    );

    const fsm = new FiniteStateMachine(
      {
        idle: {
          enter: () => {},
          update: () => {},
          // exit : () => {

          // }
        },
      },
      "idle"
    );
    this.fsm = fsm;
  }

  update(delta) {
    this.fsm.update(delta);
  }
}
