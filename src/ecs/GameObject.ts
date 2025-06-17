import * as THREE from "three";

function removeArrayElement<T>(array: T[], element: T): void {
  const ndx = array.indexOf(element);
  if (ndx >= 0) {
    array.splice(ndx, 1);
  }
}

interface Component {
  enabled?: boolean;
  update?(delta: number): void;
  destroy?(): void;
}

interface GameObjectListeners {
  [eventName: string]: ((payload?: any) => void)[];
}


export class GameObject {
  name: string;
  parent:THREE.Object3D
  components: Component[] = [];
  transform: THREE.Object3D = new THREE.Object3D();
  _listeners: GameObjectListeners = {};
  tag: string;
  markedForRemoval: boolean = false;

  constructor(parent: THREE.Object3D, name: string, tag: string = "") {
    this.name = name;
    this.parent = parent;
    parent.add(this.transform);
    this.tag = tag;
  }

  addComponent<T extends Component>(
    ComponentType: new (gameObject: GameObject, ...args: any[]) => T,
    ...args: any[]
  ): T {
    const component = new ComponentType(this, ...args);
    this.components.push(component);
    return component;
  }

  removeComponent(component: Component): void {
    if (typeof component.destroy === "function") {
      component.destroy();
    }
    removeArrayElement(this.components, component);
  }

  getComponent<T extends Component>(
    ComponentType: new (gameObject: GameObject, ...args: any[]) => T
  ): T | undefined {
    return this.components.find((c) => c instanceof ComponentType) as
      | T
      | undefined;
  }

  setPosition(vector3: THREE.Vector3): void {
    this.transform.position.set(vector3.x, vector3.y, vector3.z);
  }

  move(vector3: THREE.Vector3): void {
    const pos = this.transform.position;
    this.transform.position.set(
      pos.x + vector3.x,
      pos.y + vector3.y,
      pos.z + vector3.z
    );
  }

  lookAt(direction: THREE.Vector3, forward: THREE.Vector3): void {
    direction.normalize();
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(forward, direction);
    this.transform.setRotationFromQuaternion(quat);
  }

  update(delta: number): void {
    for (const component of this.components) {
      if (component.enabled && component.update) {
        component.update(delta);
      }
    }
  }
  destroy(): void {
    for (const component of this.components) {
      if (component.destroy) {
        component.destroy();
      }
    }
  }

  on(eventName: string, handler: (payload?: any) => void): void {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }
    this._listeners[eventName].push(handler);
  }

  off(eventName: string, handler: (payload?: any) => void): void {
    const handlers = this._listeners[eventName];
    if (!handlers) return;
    this._listeners[eventName] = handlers.filter((h) => h !== handler);
  }

  emit(eventName: string, payload?: any): void {
    const handlers = this._listeners[eventName];
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (err: any) {
        console.error(`Error in handler for "${eventName}":`, err);
      }
    }
  }
}
