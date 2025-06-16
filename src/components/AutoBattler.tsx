"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";

// ECS, Units, Physics, etc.
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { UnitManager } from "@/units/UnitManager";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { Archer } from "@/units/Archer";
import { UnitBlueprint } from "@/components/UnitBlueprint";
import { models as globalModelList } from "@/components/meshes/ModelList";
import {
  GridTile,
  UnitPlacementSystem,
  UnitPlacementSystemHandle,
  getMaxUnits,
} from "@/components/UnitPlacementSystem";
import { loadGLTFModels } from "@/components/useGLTFModels";

// Custom Hooks
import { useThreeScene } from "@/hooks/useThreeScene";
import { usePhysicsWorld } from "@/hooks/usePhysicsWorld";
import { useMapManager } from "@/hooks/useMapManager";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useRoundManager } from "@/hooks/useRoundManager"; // Assuming ENEMY_TEAM_ID is exported for consistency

// UI Components
import GameUI from "./GameUI"; // Assuming this is in the same folder or correct path
import BuyMenuContainer from "@/components/BuyMenuContainer";

// Game Logic
import { spawnSingleUnit } from "@/gameLogic/unitActions";
import { spawnEnemyWave, ENEMY_TEAM_ID } from "@/gameLogic/enemySpawner"; // Import the spawner and its ENEMY_TEAM_ID

// Types
import { GameSystems, Player } from "@/types/gameTypes"; // PlayerUnitInstance might not be needed directly here anymore
import { useRaycaster } from "@/hooks/useRaycaster";

const AutoBattler: React.FC = () => {
  // Single player state
  const [player, setPlayer] = useState<Player | undefined>(undefined);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<"setup" | "battle" | "end">(
    "setup"
  );
  const [currentMap, setCurrentMap] =
    useState<keyof typeof globalModelList>("prototypeMap");
  const [roundTimer, setRoundTimer] = useState<number>(30); // Initial setup time
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const placementRef = useRef<UnitPlacementSystemHandle>(null);
  const placementSystemPosition = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const [systemsReady, setSystemsReady] = useState(false);

  

  useEffect(() => {
    if (
      isLoaded &&
      player &&
      sceneRef.current &&
      worldRef.current &&
      unitManagerRef.current &&
      placementRef.current &&
      gameObjectManagerRef.current
    ) {
      setSystemsReady(true); // triggers the re-render you need
    }
  }, [isLoaded, player]); // anyone you *know* will change

  // GLTF Models Loading Effect
  useEffect(() => {
    async function loadGLTFModelsAsync(): Promise<void> {
      return new Promise((resolve) => loadGLTFModels(resolve));
    }
    loadGLTFModelsAsync().then(() => {
      setIsLoaded(true);
      console.log("All GLTF models loaded!");
    });
  }, []);

  // Setup Three.js scene, camera, renderer
  const { threeRef, sceneRef } = useThreeScene(containerRef, isLoaded);

  // Setup Physics World and Managers
  const {
    worldRef,
    gameObjectManagerRef,
    unitManagerRef,
    projectileManagerRef,
  } = usePhysicsWorld(sceneRef, isLoaded);

  // Load Map and Collision
  useMapManager(threeRef, worldRef, gameObjectManagerRef, currentMap, isLoaded);

  // Main Game Render Loop
  useGameLoop(
    threeRef,
    worldRef,
    gameObjectManagerRef,
    unitManagerRef,
    isGameActive,
    roundState
  );

  const systems: Partial<GameSystems> = {
    unitManager: unitManagerRef.current,
    gameObjectManager: gameObjectManagerRef.current,
    placementSystem: placementRef.current,
    scene: sceneRef.current,
    world: worldRef.current,
    projectileManager: projectileManagerRef.current,
  };

  // Game Round Logic (timer, state transitions, cleanup)
  // Ensure useRoundManager is adapted for single player and receives all necessary refs
  useRoundManager(isGameActive, roundState, currentRound, player, systems, {
    setIsGameActive,
    setRoundState,
    setCurrentRound,
    setRoundTimer,
    setPlayer,
  });

  useRaycaster(
    threeRef,
    worldRef,
    gameObjectManagerRef,
    roundState,
    placementRef
  );

  const maxUnits =
    placementRef.current && player // Ensure player exists before calculating max units for them
      ? getMaxUnits(placementRef.current.getGridTiles()) // This might need adjustment for single player grid area
      : 0;

  const startGame = useCallback(() => {
    if (!isLoaded || !unitManagerRef.current || !gameObjectManagerRef.current) {
      alert("Game assets or systems not ready. Please wait.");
      return;
    }
    // Initialize player for the game
    setPlayer({ id: 1, gold: 100, units: [] }); // Example starting gold

    setCurrentRound(1);
    setIsGameActive(true);
    setRoundState("setup");
    console.log("Game started!");
  }, [isLoaded, unitManagerRef, gameObjectManagerRef]);

  const startBattlePhase = useCallback(() => {
    if (!player || player.units.length === 0) {
      alert("Place some units before starting the battle!");
      return;
    }

    setRoundState("battle");
    // Timer for battle phase will be set by useRoundManager or the effect below
    console.log("Attempting to start Battle phase!");
  }, [player, setRoundState, setRoundTimer]);

  const handlePurchaseUnit = useCallback(
    (
      blueprint: UnitBlueprint,
      tile: GridTile
      // playerId is removed as we have a single player
    ): boolean => {
      if (!player) {
        console.error("Player not initialized. Cannot purchase unit.");
        return false;
      }
      if (!placementRef.current) {
        console.error(
          "Placement Reference is undefined when trying to buy a unit!"
        );
        return false;
      }

      const gridPositions = placementRef.current.getGridTiles();
      if (!gridPositions || gridPositions.length === 0) {
        alert("Placement grid not ready.");
        return false;
      }

      if (player.gold < blueprint.cost) {
        alert("Not enough gold!");
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
      if (blueprint.unitClass === Archer && !projectileManagerRef.current) {
        alert("Projectile system not ready. Cannot purchase Archer.");
        return false;
      }

      // Ensure player doesn't exceed max unit count
      if (player.units.length >= maxUnits && maxUnits > 0) {
        alert("Your board is full! Cannot buy more units.");
        return false;
      }

      const newUnitGameObject = spawnSingleUnit({
        blueprint,
        playerIdToSpawn: player.id, // Use the single player's ID
        scene: sceneRef.current,
        world: worldRef.current,
        unitManager: unitManagerRef.current,
        gameObjectManager: gameObjectManagerRef.current,
        position: tile.position,
        projectileManager: projectileManagerRef.current,
      });

      if (newUnitGameObject) {
        placementRef.current.markOccupied(tile.row, tile.col, true);
        setPlayer((prevPlayer) => {
          if (!prevPlayer) return undefined; // Should not happen if initial check passes
          return {
            ...prevPlayer,
            gold: prevPlayer.gold - blueprint.cost,
            units: [
              ...prevPlayer.units,
              {
                id: newUnitGameObject.name,
                blueprintName: blueprint.name,
                gameObject: newUnitGameObject,
              },
            ],
          };
        });
        return true;
      }
      return false;
    },
    [
      player,
      sceneRef,
      worldRef,
      unitManagerRef,
      gameObjectManagerRef,
      projectileManagerRef,
    ]
  );

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
      <GameUI
        currentRound={currentRound}
        roundState={roundState}
        roundTimer={roundTimer}
        players={player ? [player] : []} // GameUI might expect an array
        maxUnits={maxUnits}
        isLoaded={isLoaded}
        isGameActive={isGameActive}
        onStartGame={startGame}
        onStartBattlePhase={startBattlePhase}
      />

      {threeRef.current && sceneRef.current && isLoaded && (
        <UnitPlacementSystem
          ref={placementRef}
          scene={sceneRef.current}
          position={placementSystemPosition} // Adjusted Y slightly for visibility above ground
          tileSize={2} // Ensure this matches assumptions in enemySpawner and buyMenu
          gridSize={6} // Example: 6x6 grid overall
        />
      )}

      {systemsReady && (
        <BuyMenuContainer
          players={player ? [player] : []} // Adapt for single player
          isGameActive={isGameActive}
          roundState={roundState}
          placementRef={placementRef}
          maxUnitsPerPlayer={maxUnits}
          onPurchaseUnit={(blueprint, tile) =>
            handlePurchaseUnit(blueprint, tile)
          } // playerId removed from args
        />
      )}
    </div>
  );
};

export default AutoBattler;
