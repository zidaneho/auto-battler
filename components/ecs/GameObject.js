import * as THREE from "three";

function removeArrayElement(array, element) {
  const ndx = array.indexOf(element);
  if (ndx >= 0) {
    array.splice(ndx, 1);
  }
}

export class GameObject {
  constructor(parent, name) {
    this.name = name;
    this.components = [];
    this.transform = new THREE.Object3D();
    parent.add(this.transform);
  }
  addComponent(ComponentType, ...args) {
    const component = new ComponentType(this, ...args);
    this.components.push(component);
    return component;
  }
  removeComponent(component) {
    removeArrayElement(this.components, component);
  }
  getComponent(ComponentType) {
    return this.components.find((c) => c instanceof ComponentType);
  }
  setPosition(vector3) {
    this.transform.position.set(vector3.x,vector3.y,vector3.z);
  }
  move(vector3) {
    const pos = transform.position;
    this.transform.position.set(
      pos.x + vector3.x,
      pos.y + vector3.y,
      pos.z + vector3.z
    );
  }
  update(delta) {
    for (const component of this.components) {
      component.update(delta);
    }
  }
}
