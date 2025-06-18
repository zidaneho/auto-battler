import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { GameObject } from "../ecs/GameObject"; // Adjust path
import { UnitManager } from "./UnitManager"; // Adjust path
import { GameObjectManager } from "../ecs/GameObjectManager"; // Adjust path
import { ProjectileManager } from "../projectiles/ProjectileManager"; // Adjust path
import { Archer } from "./Archer"; // Adjust path
// import { Priest } from "../units/Priest"; // If Priest needs specific args
import { UnitBlueprint } from "@/components/UnitBlueprint"; // Adjust path
import { useModelStore } from "@/components/ModelStore"; // Adjust path
import { UnitStats } from "./UnitStats"; // Adjust path
import { HealthComponent } from "@/stats/HealthComponent"; // Adjust path
import { CharacterRigidbody } from "../physics/CharacterRigidbody"; // Adjust path

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

  const unitArgs: any[] = []; // Common arg: teamId. Model is handled by createUnit directly.

  if (blueprint.unitClass === Archer) {
    if (!projectileManager) {
      console.error(
        "ProjectileManager is required for Archer but not provided."
      );
      return null;
    }
    unitArgs.push(projectileManager);
    unitArgs.push(new THREE.Vector3(0, 1.2, 0.5)); // projectileSpawnPoint for Archer
  }
  // Add other unit-specific args here, e.g., for Priest

  const unitGameObject = unitManager.createUnit(
    blueprint.unitClass,
    blueprint.stats,
    playerIdToSpawn,
    position,
    blueprint.attackDef,
    gameObjectManager,
    scene,
    `${blueprint.name}_P${playerIdToSpawn}`, // More unique name
    modelData, // Pass the full modelData object
    world,
    blueprint.collider.offset.clone(),
    blueprint.collider.size.clone(),
    ...unitArgs // Pass teamId and any specific args for the unit component constructor
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
