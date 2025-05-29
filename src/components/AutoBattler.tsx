"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d"; // Keep for types if needed by functions remaining here

// ECS, Units, Physics, etc. (direct imports for types or specific classes if still needed)
import { GameObjectManager } from "@/ecs/GameObjectManager"; // Path based on new structure
import { UnitManager } from "@/units/UnitManager"; // Path based on new structure
import { ProjectileManager } from "@/projectiles/ProjectileManager"; // Path based on new structure
import { Archer } from "@/units/Archer"; // Path based on new structure
import { UnitBlueprint } from "@/components/UnitBlueprint"; // Path based on new structure
import { models as globalModelList } from "@/components/meshes/ModelList"; // Path based on new structure
import {
  UnitPlacementSystem,
  UnitPlacementSystemHandle,
  getMaxUnits,
  // fillUnitOnGrid, // If used, ensure it's imported
} from "@/components/UnitPlacementSystem"; // Path based on new structure
import { loadGLTFModels } from "@/components/useGLTFModels"; // Path based on new structure

// Custom Hooks
import { useThreeScene, ThreeSceneRef } from "@/hooks/useThreeScene";
import { usePhysicsWorld } from "@/hooks/usePhysicsWorld";
import { useMapManager } from "@/hooks/useMapManager";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useRoundManager } from "@/hooks/useRoundManager";

// UI Components
import GameUI from "./GameUI";
import BuyMenuContainer from "@/components/BuyMenuContainer";

// Game Logic
import { spawnSingleUnit } from "@/gameLogic/unitActions";

// Types
import { Player, PlayerUnitInstance } from "@/types/gameTypes";

const AutoBattler: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, gold: 250, units: [] },
    { id: 2, gold: 250, units: [] },
  ]);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<"setup" | "battle" | "end">(
    "setup"
  );
  const [currentMap, setCurrentMap] =
    useState<keyof typeof globalModelList>("prototypeMap");
  const [roundTimer, setRoundTimer] = useState<number>(30);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const placementRef = useRef<UnitPlacementSystemHandle>(null);

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

  // Game Round Logic (timer, state transitions, cleanup)
  useRoundManager(
    isGameActive,
    roundState,
    setRoundState,
    currentRound,
    setCurrentRound,
    roundTimer,
    setRoundTimer,
    setPlayers,
    unitManagerRef
    // gameObjectManagerRef // Pass if useRoundManager needs it for clearBoardAndUnitsGlobally
  );

  const maxUnits = placementRef.current
    ? getMaxUnits(placementRef.current.getGridPositions())
    : 0;

  const startGame = useCallback(() => {
    if (!isLoaded || !unitManagerRef.current || !gameObjectManagerRef.current) {
      alert("Game assets or systems not ready. Please wait.");
      return;
    }
    setIsGameActive(true);
    setRoundState("setup"); // Should already be setup, but good for explicit start
    setRoundTimer(30);
    console.log("Game started!");
  }, [isLoaded, unitManagerRef, gameObjectManagerRef]);

  const startBattlePhase = useCallback(() => {
    setRoundState("battle");
    setRoundTimer(30); // Or battle-specific timer
    console.log("Battle phase started!");
  }, []);

  const handlePurchaseUnit = useCallback(
    (
      blueprint: UnitBlueprint,
      position: THREE.Vector3,
      pId: number
    ): boolean => {
      if (!placementRef.current) {
        console.error(
          "Placement Reference is undefined when trying to buy a unit!"
        );
        return false;
      }

      const playerIndex = players.findIndex((p) => p.id === pId);
      if (playerIndex === -1) return false;
      const player = players[playerIndex];

      const gridPositions = placementRef.current.getGridPositions();
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

      const newUnitGameObject = spawnSingleUnit({
        blueprint,
        playerIdToSpawn: pId,
        scene: sceneRef.current,
        world: worldRef.current,
        unitManager: unitManagerRef.current,
        gameObjectManager: gameObjectManagerRef.current,
        position,
        projectileManager: projectileManagerRef.current,
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
                    id: newUnitGameObject.name, // Ensure GameObject has a name
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
    },
    [
      players,
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
        players={players}
        maxUnits={maxUnits}
        isLoaded={isLoaded}
        isGameActive={isGameActive}
        onStartGame={startGame}
        onStartBattlePhase={startBattlePhase}
      />

      {threeRef.current && sceneRef.current && isLoaded && (
        <UnitPlacementSystem
          ref={placementRef}
          scene={sceneRef.current} // Pass the actual scene object
          position={new THREE.Vector3(0, 1, 0)} // Adjusted Y slightly for visibility above ground
          tileSize={2}
          gridSize={6} // Example: 6x6 grid overall
        />
      )}

      {isLoaded &&
        sceneRef.current &&
        worldRef.current &&
        unitManagerRef.current &&
        placementRef.current &&
        gameObjectManagerRef.current && (
          <BuyMenuContainer
            players={players}
            isGameActive={isGameActive}
            roundState={roundState}
            placementRef={placementRef}
            maxUnitsPerPlayer={maxUnits} // Or a player-specific limit
            onPurchaseUnit={handlePurchaseUnit}
          />
        )}
    </div>
  );
};

export default AutoBattler;
