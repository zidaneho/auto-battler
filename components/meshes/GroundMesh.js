import { GameComponent } from "../ecs/GameComponent";
import * as THREE from "three";

export class GroundMesh extends GameComponent {
  constructor(gameObject, width, height, depth) {
    super(gameObject);
    //Ground Plane
    this.width = width;
    this.height = height;
    this.depth = depth;

    const ground_texture = new THREE.TextureLoader().load("/checker.png");
    ground_texture.wrapS = THREE.RepeatWrapping;
    ground_texture.wrapT = THREE.RepeatWrapping;

    ground_texture.repeat.set(1, 1); // Tiles it 10x10 across the surface
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
