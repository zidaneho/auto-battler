import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { GameObject } from "../ecs/GameObject"; // Adjust path
import { UnitManager } from "./UnitManager"; // Adjust path
import { GameObjectManager } from "../ecs/GameObjectManager"; // Adjust path
import { ProjectileManager } from "../projectiles/ProjectileManager"; // Adjust path
import { Archer } from "./Archer"; // Adjust path
import { UnitBlueprint } from "@/units/UnitBlueprint"; // Adjust path
import { useModelStore } from "@/components/ModelStore"; // Adjust path
import { UnitStats } from "./UnitStats"; // Adjust path
import { CharacterRigidbody } from "../physics/CharacterRigidbody"; // Adjust path
import { Unit, UnitConstructionParams } from "./Unit";
import { UnitPlacementSystemHandle } from "./UnitPlacementSystem";
import { VFXManager } from "@/particles/VFXManager";

interface SpawnSingleUnitParams {
  blueprint: UnitBlueprint;
  playerIdToSpawn: number;
  scene: THREE.Scene;
  world: RAPIER.World;
  unitManager: UnitManager;
  gameObjectManager: GameObjectManager;
  position: THREE.Vector3;
  projectileManager: ProjectileManager | undefined;
  vfxManager: VFXManager | undefined;
}

export const spawnSingleUnit = ({
  blueprint,
  playerIdToSpawn,
  scene,
  world,
  unitManager,
  gameObjectManager,
  position,
  projectileManager,
  vfxManager,
}: SpawnSingleUnitParams): GameObject | null => {
  const modelData = useModelStore.getState().models[blueprint.modelKey];
  if (!modelData || !modelData.gltf) {
    console.warn(
      `Model ${blueprint.modelKey} not loaded in ModelStore for ${blueprint.name}.`
    );
    return null;
  }
  if (!vfxManager) return null;

  // 1. Assemble the complete construction params object here
  const constructionParams: UnitConstructionParams = {
    model: modelData,
    teamId: playerIdToSpawn,
    spawnPosition: position,
    blueprint: blueprint,
    vfxManager: vfxManager,
  };

  // 2. Add subclass-specific dependencies directly to the params object
  if (blueprint.useProjectiles) {
    if (!projectileManager) {
      console.error(
        "ProjectileManager is required for Archer but not provided."
      );
      return null;
    }
    constructionParams.projectileManager = projectileManager;
    constructionParams.projectileSpawnPoint = new THREE.Vector3(0, 1.2, 0.5);
  }

  // 3. Call the simplified createUnit method
  const unitGameObject = unitManager.createUnit(
    blueprint.unitClass,
    constructionParams, // Pass the single, complete params object
    gameObjectManager,
    scene,
    `${blueprint.name}_P${playerIdToSpawn}`,
    modelData,
    world,
    blueprint.collider.offset.clone(),
    blueprint.collider.size.clone()
  );

  if (unitGameObject) {
    const unitComponent = unitGameObject.getComponent(blueprint.unitClass);
    if (unitComponent) {
      const rb = unitGameObject.getComponent(CharacterRigidbody);
      rb?.setPosition(position.clone());

      // Set the initial rotation based on the team ID.
      // We'll assume the player's ID is 1. Player units face "forward" (default rotation).
      // Enemy units are rotated 180 degrees to face the player.
      if (playerIdToSpawn !== 1) {
        // Assuming 1 is the main player
        unitGameObject.transform.rotation.y = (3 * Math.PI) / 2; // Rotate 180 degrees
      } else {
        unitGameObject.transform.rotation.y = Math.PI / 2;
      }

      console.log(
        `Spawned ${
          blueprint.name
        } for player ${playerIdToSpawn} at ${position.x.toFixed(
          2
        )}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`
      );
      return unitGameObject;
    } else {
      console.error(
        "Failed to get unit component after creation for",
        blueprint.name
      );
      unitGameObject.markedForRemoval = true;
      return null;
    }
  }
  console.error("Failed to create GameObject for unit:", blueprint.name);
  return null;
};
