import { GameComponent } from "@/ecs/GameComponent";
import { GameObject } from "@/ecs/GameObject";

//tag component; useRaycaster.ts implements checking
export class ClickableComponent extends GameComponent {
    teamId : number;
    constructor(gameObject : GameObject, id : number) {
        super(gameObject);
        this.teamId = id;
    }
    
}