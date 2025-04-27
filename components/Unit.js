import { models } from "./ModelList";
import { Component } from "@/components/ecs/Component";
import { SkinInstance } from "@/components/SkinInstance";
import { FiniteStateMachine } from "./FiniteStateMachine";

export class Unit extends Component {
  constructor(gameObject,model) {
    super(gameObject);
    const skinInstance = gameObject.addComponent(SkinInstance, model);
    this.skinInstance.setAnimation("shield_02_walk");

    this.fsm = new FiniteStateMachine( {
        idle: {
            enter : () => {

            },
            update : () => {

            },
            // exit : () => {

            // }
        }
    })

  }


}
