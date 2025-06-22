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
import { UnitConstructionParams } from "./Unit";

interface SpawnSingleUnitParams {
  blueprint: UnitBlueprint;
  playerIdToSpawn: number;
  scene: THREE.Scene;
  world: RAPIER.World;
  unitManager: UnitManager;
  gameObjectManager: GameObjectManager;
  position: THREE.Vector3;
  projectileManager: ProjectileManager | undefined;
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
}: SpawnSingleUnitParams): GameObject | null => {
  const modelData = useModelStore.getState().models[blueprint.modelKey];
  if (!modelData || !modelData.gltf) {
    console.warn(
      `Model ${blueprint.modelKey} not loaded in ModelStore for ${blueprint.name}.`
    );
    return null;
  }

  // 1. Assemble the complete construction params object here
  const constructionParams: UnitConstructionParams = {
    model: modelData,
    teamId: playerIdToSpawn,
    spawnPosition: position,
    blueprint: blueprint,
  };

  // 2. Add subclass-specific dependencies directly to the params object
  if (blueprint.unitClass === Archer) {
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