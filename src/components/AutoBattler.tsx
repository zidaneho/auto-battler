"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as RAPIER from "@dimforge/rapier3d";

import { GameObjectManager } from "./ecs/GameObjectManager";
import { UnitManager } from "./units/UnitManager";
import {
  fillUnitOnGrid, // Can be used for initial setup or testing
  UnitPlacementSystem,
  UnitPlacementSystemHandle,
} from "./UnitPlacementSystem";
import { loadGLTFModels } from "./useGLTFModels";
import { useModelStore, Model as ModelStoreModel } from "./ModelStore"; // Ensure Model is exported from ModelStore
import { models as globalModelList } from "./meshes/ModelList"; // Renamed to avoid conflict
import BuyMenu from "./BuyMenu";
import { CharacterRigidbody } from "./physics/CharacterRigidbody";
import { GameObject } from "./ecs/GameObject";
import { Unit } from "./units/Unit"; // Import Unit for type checking

// For ProjectileManager if Archer is purchasable
import { ProjectileManager } from "./projectiles/ProjectileManager";
import { Archer } from "./units/Archer"; // For specific constructor args
import { Priest } from "./units/Priest"; // For specific constructor args
import { UnitStats } from "./units/UnitStats";
import { HealthComponent } from "./HealthComponent";
import { UnitBlueprint } from "./UnitBlueprint";
import { allUnitBlueprints } from "./UnitBlueprintList";
import { StaticBody } from "./physics/StaticBody";
import { BoxCollider } from "./physics/BoxCollider";
import { DebugMesh } from "./meshes/DebugMesh";

interface PlayerUnitInstance {
  id: string; // Unique ID for the unit instance (e.g., gameObject.name)
  blueprintName: string;
  gameObject: GameObject;
}

interface Player {
  id: number;
  gold: number;
  units: PlayerUnitInstance[];
}

const MAX_UNITS_PER_PLAYER = 8; // Max units a player can have on their board

const AutoBattler: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, gold: 250, units: [] }, // Initial gold
    { id: 2, gold: 250, units: [] },
  ]);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<"setup" | "battle" | "end">(
    "setup"
  );
  const [currentMap, setCurrentMap] =
    useState<keyof typeof globalModelList>("prototypeMap");
  const [roundTimer, setRoundTimer] = useState<number>(30); // Timer for setup/battle
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Tracks if GLTF models are loaded

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const worldRef = useRef<RAPIER.World | null>(null);
  const gameObjectManagerRef = useRef<GameObjectManager | null>(null);
  const unitManagerRef = useRef<UnitManager | null>(null);
  const placementRef1 = useRef<UnitPlacementSystemHandle>(null);
  const placementRef2 = useRef<UnitPlacementSystemHandle>(null);
  const projectileManagerRef = useRef<ProjectileManager | null>(null); // For Archers

  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
  } | null>(null);

  // Effect for loading GLTF models
  useEffect(() => {
    async function loadGLTFModelsAsync(): Promise<void> {
      return new Promise((resolve) => loadGLTFModels(resolve));
    }
    loadGLTFModelsAsync().then(() => {
      setIsLoaded(true);
      console.log("All GLTF models loaded!");
    });
  }, []);

  // Effect for Three.js scene setup
  useEffect(() => {
    if (!containerRef.current || !isLoaded) return; // Wait for models

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c); // Darker background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60, // Slightly less FOV
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 20); // Positioned to see both grids

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true; // Enable shadows
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0); // Target center

    threeRef.current = { scene, camera, renderer, controls };

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const { camera: cam, renderer: rend } = threeRef.current;
      cam.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      cam.updateProjectionMatrix();
      rend.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isLoaded]); // Re-run if isLoaded changes

  // Effect for physics world and managers setup
  useEffect(() => {
    if (!worldRef.current && sceneRef.current) {
      // Ensure scene is available for ProjectileManager
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      const world = new RAPIER.World(gravity);
      worldRef.current = world;
      const goManager = new GameObjectManager(world);
      gameObjectManagerRef.current = goManager;
      unitManagerRef.current = new UnitManager();
      projectileManagerRef.current = new ProjectileManager(
        goManager,
        sceneRef.current,
        world
      );
    }
  }, [isLoaded]); // Depends on isLoaded to ensure sceneRef is potentially set

  // Effect for loading map model
  const mapModel = useModelStore((s) => s.models[currentMap]);
  const collisionMapModel = useModelStore(
    (s) => s.models["CollisionMap_" + currentMap]
  );
  useEffect(() => {
    if (!threeRef.current?.scene || !mapModel?.gltf || !isLoaded) return;
    const scene = threeRef.current.scene;
    scene.children
      .filter((c) => c.userData.isMap)
      .forEach((c) => scene.remove(c)); // Clear old map
    const newMapInstance = mapModel.gltf.clone();
    newMapInstance.userData.isMap = true;

    scene.add(newMapInstance);

    //initialize collision map
    if (collisionMapModel?.gltf && gameObjectManagerRef.current) {
      const collisionMapInstance = collisionMapModel.gltf.clone();
      scene.add(collisionMapInstance);
      collisionMapInstance.position.copy(newMapInstance.position);
      collisionMapInstance.rotation.copy(newMapInstance.rotation);
      collisionMapInstance.scale.copy(newMapInstance.scale);

      collisionMapInstance.traverse((child) => {
        const gameObject = gameObjectManagerRef.current?.createGameObject(
          collisionMapInstance,
          "CollisionPart",
          "terrain"
        );

        if (!gameObject) return;

        // Match transform
        gameObject.setPosition(child.getWorldPosition(new THREE.Vector3()));
        gameObject.transform.setRotationFromQuaternion(
          child.getWorldQuaternion(new THREE.Quaternion())
        );
        gameObject.transform.scale.copy(
          child.getWorldScale(new THREE.Vector3())
        );

        // Use world-scale size for the collider
        const scale = new THREE.Vector3();
        child.getWorldScale(scale);
        const collider = gameObject?.addComponent(
          BoxCollider,
          scale.x,
          scale.y,
          scale.z
        );

        const body = gameObject?.addComponent(
          StaticBody,
          worldRef.current,
          collider?.description
        );

        gameObject?.addComponent(DebugMesh, body, sceneRef.current);
      });
      console.log("collision map loaded");
    }
    console.log(`Map loaded: ${currentMap}`);
  }, [
    gameObjectManagerRef,
    worldRef,
    sceneRef,
    mapModel,
    currentMap,
    isLoaded,
  ]);

  // Main game render loop
  useEffect(() => {
    if (
      !threeRef.current ||
      !worldRef.current ||
      !gameObjectManagerRef.current ||
      !unitManagerRef.current
    )
      return;

    // Only run loop if game is active or in setup (to see placements)
    if (!isGameActive && roundState !== "setup") return;

    const { scene, camera, renderer, controls } = threeRef.current;
    const world = worldRef.current;
    const gameObjectManager = gameObjectManagerRef.current;
    const unitManager = unitManagerRef.current;
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const delta = clock.getDelta();
      // Step physics and update managers only if battle is active,
      // or if game is active (even in setup, for potential animations)
      if (isGameActive) {
        world.step();
        gameObjectManager.update(delta);
        if (roundState === "battle") {
          unitManager.update();
        }
      }
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isGameActive, roundState]); // Re-run if game state changes

  // Game round logic (timer, state transitions)
  useEffect(() => {
    if (!isGameActive) return;

    let intervalId: NodeJS.Timeout;

    if (roundState === "battle") {
      unitManagerRef.current?.setTargets();
      unitManagerRef.current?.playAllUnits();
    }
    if (roundState === "setup" || roundState === "battle") {
      intervalId = setInterval(() => {
        setRoundTimer((prev) => {
          if (prev <= 1) {
            if (roundState === "setup") setRoundState("battle");
            else if (roundState === "battle") setRoundState("end");
            return roundState === "setup" ? 15 : 0; // Reset timer for battle or end
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [roundState, isGameActive]);

  const clearBoardAndUnits = () => {
    if (unitManagerRef.current && gameObjectManagerRef.current) {
      const allUnits = unitManagerRef.current.getAllUnits();
      allUnits.forEach((unit) => {
        if (unit.gameObject) {
          // Mark the GameObject for removal. The GameObjectManager's update loop will handle the actual destruction.
          unit.gameObject.markedForRemoval = true;
        }
      });

      // After marking, tell UnitManager to clear its internal list.
      // The GameObjects will be removed by the GameObjectManager's update cycle.
      unitManagerRef.current.clearAllUnits();
    }

    // Reset player-specific unit and board tracking in the React state
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => ({
        ...p,
        units: [], // Clear units array from player state
        board: [], // Clear board array from player state
      }))
    );
  };

  useEffect(() => {
    if (roundState !== "end") return;

    // Update gold (this part is fine)
    setPlayers((prev) => prev.map((p) => ({ ...p, gold: p.gold + 20 })));

    // *** Add cleanup logic before starting the next round's setup ***
    clearBoardAndUnits();

    setTimeout(() => {
      setCurrentRound((r) => r + 1);
      setRoundState("setup");
      setRoundTimer(30); // Default round duration
    }, 3000); // Consider the timing; cleanup should ideally happen before "setup" state begins.
  }, [roundState]); // Dependency array includes roundState

  //THIS IS NOT THE BUTTON TO START PLAYING THE ROUND.
  const startGame = () => {
    if (!isLoaded || !unitManagerRef.current || !gameObjectManagerRef.current) {
      alert("Game assets or systems not ready. Please wait.");
      return;
    }

    setIsGameActive(true);
    setRoundState("setup");
    setRoundTimer(30); // Setup timer
  };

  // --- BuyMenu Integration Functions ---
  const getPlayerPlacementSystem = (
    pId: number
  ): UnitPlacementSystemHandle | null => {
    return pId === 1 ? placementRef1.current : placementRef2.current;
  };

  const getOccupiedSlots = (pId: number): THREE.Vector3[] => {
    const player = players.find((p) => p.id === pId);
    if (!player) return [];
    return player.units.map((unit) => unit.gameObject.transform.position);
  };

  const spawnSingleUnit = ({
    blueprint,
    playerIdToSpawn,
    scene,
    world,
    unitManager,
    gameObjectManager,
    position,
    projectileManager, // Added for Archer
  }: {
    blueprint: UnitBlueprint;
    playerIdToSpawn: number;
    scene: THREE.Scene;
    world: RAPIER.World;
    unitManager: UnitManager;
    gameObjectManager: GameObjectManager;
    position: THREE.Vector3;
    projectileManager: ProjectileManager | null; // Make it explicit
  }): GameObject | null => {
    const modelData = useModelStore.getState().models[blueprint.modelKey];
    if (!modelData || !modelData.gltf) {
      console.warn(`Model ${blueprint.modelKey} not loaded in ModelStore.`);
      return null;
    }

    const unitArgs: any[] = [modelData, playerIdToSpawn]; // Common args: model, teamId

    // Add specific arguments for certain unit types
    if (blueprint.unitClass === Archer) {
      if (!projectileManager) {
        console.error(
          "ProjectileManager is required for Archer but not provided."
        );
        return null;
      }
      unitArgs.push(projectileManager); // Archer needs ProjectileManager
      unitArgs.push(new THREE.Vector3(0, 1.2, 0.5)); // projectileSpawnPoint for Archer (example)
    }
    // Priest might also need specific args if its constructor is different

    const unitGameObject = unitManager.createUnit(
      blueprint.unitClass,
      position,
      gameObjectManager,
      scene,
      `${blueprint.name}_${playerIdToSpawn}`, // Unique name for the GameObject
      modelData, // This should be the object { gltf, animations, damagePoint1 } from ModelStore
      world,
      blueprint.collider.offset.clone(),
      blueprint.collider.size.clone(),
      ...unitArgs.slice(1) // Pass teamId and any specific args. Model is handled by createUnit's model param.
      // createUnit expects (gameObject, model, teamId, ...specifics)
      // The model parameter in createUnit itself is what takes modelData.
      // So, unitArgs for addComponent should be [modelData, playerId, ...specifics]
      // And for createUnit, model parameter is modelData, then unitArgs for the component are [playerId, ...specifics]
    );

    if (unitGameObject) {
      const unitComponent = unitGameObject.getComponent(blueprint.unitClass);
      if (unitComponent) {
        // Apply stats from blueprint
        const statsComp = unitGameObject.getComponent(UnitStats);
        if (statsComp) {
          statsComp.health = blueprint.stats.health;
          statsComp.maxHealth = blueprint.stats.health * 2; // Assuming HealthComponent uses this from UnitStats
          statsComp.attack = blueprint.stats.attack;
          statsComp.attackSpeed = blueprint.stats.attackSpeed;
          statsComp.moveSpeed = blueprint.stats.moveSpeed;
          statsComp.healingPower = blueprint.stats.healingPower;
        }
        const healthComponent = unitGameObject.getComponent(HealthComponent);
        if (healthComponent) {
          healthComponent.health = blueprint.stats.health; // Directly set initial health
          healthComponent.maxHealth = blueprint.stats.health * 2;
        }

        const rb = unitGameObject.getComponent(CharacterRigidbody);
        rb?.setPosition(position.clone()); // Set physical position

        console.log(
          `Spawned ${blueprint.name} for player ${playerIdToSpawn} at ${position.x}, ${position.y}, ${position.z}`
        );
        return unitGameObject;
      } else {
        console.error(
          "Failed to get unit component after creation for",
          blueprint.name
        );
        unitGameObject.markedForRemoval = true; // Clean up if component not found
        return null;
      }
    }
    return null;
  };

  const handlePurchaseUnit = (
    blueprint: UnitBlueprint,
    position: THREE.Vector3,
    pId: number
  ): boolean => {
    const playerIndex = players.findIndex((p) => p.id === pId);
    if (playerIndex === -1) return false;
    const player = players[playerIndex];

    if (player.gold < blueprint.cost) {
      alert("Not enough gold!"); // Should be caught by BuyMenu's disabled state too
      return false;
    }
    if (
      !sceneRef.current ||
      !worldRef.current ||
      !unitManagerRef.current ||
      !gameObjectManagerRef.current
    ) {
      alert("Core game systems are not ready. Cannot purchase unit.");
      return false;
    }
    // Special check for Archer needing ProjectileManager
    if (blueprint.unitClass === Archer && !projectileManagerRef.current) {
      alert("Projectile system not ready. Cannot purchase Archer.");
      return false;
    }

    const newUnitGameObject = spawnSingleUnit({
      blueprint,
      playerIdToSpawn: pId,
      scene: sceneRef.current,
      world: worldRef.current,
      unitManager: unitManagerRef.current,
      gameObjectManager: gameObjectManagerRef.current,
      position,
      projectileManager: projectileManagerRef.current, // Pass it here
    });

    if (newUnitGameObject) {
      setPlayers((prevPlayers) =>
        prevPlayers.map((p, index) => {
          if (index === playerIndex) {
            return {
              ...p,
              gold: p.gold - blueprint.cost,
              units: [
                ...p.units,
                {
                  id: newUnitGameObject.name,
                  blueprintName: blueprint.name,
                  gameObject: newUnitGameObject,
                },
              ],
            };
          }
          return p;
        })
      );
      return true;
    }
    return false;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* UI Overlay for game info */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "#e2e8f0", // Light gray/blue text
          zIndex: 10,
          backgroundColor: "rgba(45, 55, 72, 0.7)", // Semi-transparent dark blue-gray
          padding: "12px",
          borderRadius: "8px",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "14px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "10px",
            borderBottom: "1px solid #718096",
            paddingBottom: "5px",
          }}
        >
          Auto Battler
        </h2>
        <div>Round: {currentRound}</div>
        <div>State: {roundState.toUpperCase()}</div>
        <div>Time: {roundTimer}s</div>
        {players.map((player) => (
          <div key={player.id} style={{ marginTop: "8px" }}>
            Player {player.id} | Gold: {player.gold} | Units:{" "}
            {player.units.length}/{MAX_UNITS_PER_PLAYER}
          </div>
        ))}
        {!isLoaded && <p>Loading assets...</p>}
        {isLoaded && !isGameActive && (
          <button
            onClick={startGame}
            style={{
              marginTop: "15px",
              padding: "10px 18px",
              fontSize: "16px",
              backgroundColor: "#38a169",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Start Game
          </button>
        )}
        {isGameActive && roundState === "setup" && (
          <button
            onClick={() => {
              setRoundState("battle");
              setRoundTimer(30);
            }}
            style={{
              marginTop: "15px",
              padding: "10px 18px",
              fontSize: "16px",
              backgroundColor: "#dd6b20",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Start Battle Phase
          </button>
        )}
      </div>

      {/* Unit Placement Systems will be rendered here if needed visually, but mostly provide refs */}
      {threeRef.current && sceneRef.current && isLoaded && (
        <>
          <UnitPlacementSystem
            ref={placementRef1}
            scene={sceneRef.current} // Pass the actual scene
            position={new THREE.Vector3(-10, 1, 0)}
            tileSize={2}
            gridSize={4} // e.g. 4x4 grid
          />
          <UnitPlacementSystem
            ref={placementRef2}
            scene={sceneRef.current} // Pass the actual scene
            position={new THREE.Vector3(10, 1, 0)}
            tileSize={2}
            gridSize={4}
          />
        </>
      )}

      {/* BuyMenu for each player, shown during setup phase */}
      {isLoaded &&
        isGameActive &&
        roundState === "setup" &&
        players.map((player) => (
          <BuyMenu
            key={`buy-menu-${player.id}`}
            playerId={player.id}
            playerGold={player.gold}
            blueprints={allUnitBlueprints}
            onPurchase={handlePurchaseUnit}
            getPlacementSystem={() => getPlayerPlacementSystem(player.id)}
            getOccupiedSlots={getOccupiedSlots}
            maxUnitsPerPlayer={MAX_UNITS_PER_PLAYER}
          />
        ))}
    </div>
  );
};

export default AutoBattler;
