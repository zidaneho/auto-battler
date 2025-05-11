import { GameComponent } from "../ecs/GameComponent";
import * as THREE from "three";

export class GroundMesh extends GameComponent {
  width: number;
  height: number;
  depth: number;

  constructor(gameObject: any, width: number, height: number, depth: number) {
    super(gameObject);
    this.width = width;
    this.height = height;
    this.depth = depth;

    const ground_texture = new THREE.TextureLoader().load("/checker.png");
    ground_texture.wrapS = THREE.RepeatWrapping;
    ground_texture.wrapT = THREE.RepeatWrapping;

    ground_texture.repeat.set(1, 1);
    ground_texture.magFilter = THREE.NearestFilter;
    const ground_mat = new THREE.MeshBasicMaterial({
      map: ground_texture,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const box = new THREE.Mesh(geometry, ground_mat);
    gameObject.transform.add(box);
  }
}