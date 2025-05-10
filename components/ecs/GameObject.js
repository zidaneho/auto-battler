import * as THREE from "three";

function removeArrayElement(array, element) {
  const ndx = array.indexOf(element);
  if (ndx >= 0) {
    array.splice(ndx, 1);
  }
}

export class GameObject {
  constructor(parent, name, tag = "") {
    this.name = name;
    this.parent = parent;
    this.components = [];
    this.transform = new THREE.Object3D();
    parent.add(this.transform);
    this._listeners = {};
    this.tag = tag;
    this.markedForRemoval = false;
  }
  addComponent(ComponentType, ...args) {
    const component = new ComponentType(this, ...args);
    this.components.push(component);
    return component;
  }
  removeComponent(component) {
    if (typeof component.destroy === "function") {
      component.destroy();
    }
    removeArrayElement(this.components, component);
  }
  getComponent(ComponentType) {
    return this.components.find((c) => c instanceof ComponentType);
  }
  setPosition(vector3) {
    this.transform.position.set(vector3.x, vector3.y, vector3.z);
  }
  move(vector3) {
    const pos = transform.position;
    this.transform.position.set(
      pos.x + vector3.x,
      pos.y + vector3.y,
      pos.z + vector3.z
    );
  }
  lookAt(direction, forward) {
    direction.normalize();
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(forward, direction);
    this.transform.setRotationFromQuaternion(quat);
  }
  update(delta) {
    for (const component of this.components) {
      component.update(delta);
    }
  }
  on(eventName, handler) {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }
    this._listeners[eventName].push(handler);
  }
  off(eventName, handler) {
    const handlers = this._listeners[eventName];
    if (!handlers) return;
    this._listeners[eventName] = handlers.filter((h) => h !== handler);
  }
  emit(eventName, payload) {
    const handlers = this._listeners[eventName];
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`Error in handler for "${eventName}":`, err);
      }
    }
  }
}
