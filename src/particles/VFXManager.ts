import { GameObject } from '@/ecs/GameObject';
import { GameObjectManager } from '@/ecs/GameObjectManager';
import { VFXBlueprint, VFX_EMITTER_TYPE } from '@/particles/VFXBlueprint';
import { VFXLibrary } from '@/particles/VFXBlueprintList';
import { ExplosionSystem } from '@/particles/ExplosionSystem';
import { FireballTrailSystem } from '@/particles/FireballTrailSystem';
import * as THREE from 'three';

export class VFXManager {
    private goManager: GameObjectManager;
    private scene: THREE.Scene;

    constructor(goManager: GameObjectManager, scene: THREE.Scene) {
        this.goManager = goManager;
        this.scene = scene;
    }

    public triggerVFX(vfxName: string, position: THREE.Vector3, parent?: THREE.Object3D): GameObject | null {
        const blueprint = VFXLibrary[vfxName];
        if (!blueprint) {
            console.warn(`VFX with name "${vfxName}" not found in library.`);
            return null;
        }

        const vfxObject = this.goManager.createGameObject(parent || this.scene, `vfx_${vfxName}`);
        vfxObject.transform.position.copy(position);

        switch (blueprint.type) {
            case VFX_EMITTER_TYPE.BURST:
                vfxObject.addComponent(ExplosionSystem, blueprint);
                break;
            case VFX_EMITTER_TYPE.TRAIL:
                vfxObject.addComponent(FireballTrailSystem, blueprint);
                break;
        }
        
        return vfxObject;
    }
}