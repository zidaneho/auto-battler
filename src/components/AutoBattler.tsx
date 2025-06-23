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
import { UnitBlueprint } from "@/units/UnitBlueprint";
import { models as globalModelList } from "@/components/meshes/ModelList";
import {
  GridTile,
  UnitPlacementSystem,
  UnitPlacementSystemHandle,
  getMaxUnits,
} from "@/units/UnitPlacementSystem";
import { loadGLTFModels } from "@/components/useGLTFModels";

// Custom Hooks
import { useThreeScene } from "@/hooks/useThreeScene";
import { usePhysicsWorld } from "@/hooks/usePhysicsWorld";
import { useMapManager } from "@/hooks/useMapManager";
import { useGameLoop } from "@/hooks/useGameLoop";

// UI Components
import GameUI from "./GameUI";
import BuyMenuContainer from "@/components/BuyMenuContainer";
import EnlistScene from "./EnlistScene";

// Game Logic
import { spawnSingleUnit } from "@/units/unitActions";

// Types
import { Player } from "@/types/gameTypes";
import { useRaycaster } from "@/hooks/useRaycaster";
import { Unit } from "@/units/Unit";
import { RoundManager, RoundState } from "@/gameLogic/roundManager"; // Import the class and enum
import { ItemBlueprint } from "@/items/ItemBlueprint";
import ShopMenuContainer from "./ShopMenuContainer";

const AutoBattler: React.FC = () => {
  // State management
  const [player, setPlayer] = useState<Player | undefined>(undefined);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<RoundState>(RoundState.Inactive); // Use the enum
  const [defeatedEnemies, setDefeatedEnemies] = useState<Unit[]>([]);
  const [currentMap, setCurrentMap] =
    useState<keyof typeof globalModelList>("prototypeMap");
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs for systems and components
  const containerRef = useRef<HTMLDivElement | null>(null);
  const placementRef = useRef<UnitPlacementSystemHandle | null>(null);
  const roundManagerRef = useRef<RoundManager | null>(null);

  const placementSystemPosition = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  // GLTF Models Loading Effect
  useEffect(() => {
    loadGLTFModels(() => {
      setIsLoaded(true);
      console.log("All GLTF models loaded!");
    });
  }, []);

  // Setup Three.js scene and Physics World
  const { threeScene } = useThreeScene(containerRef, isLoaded);

  const {
    worldRef,
    gameObjectManagerRef,
    unitManagerRef,
    projectileManagerRef,
  } = usePhysicsWorld(threeScene, isLoaded);

  // This effect will keep the RoundManager's player reference up to date
  useEffect(() => {
    if (roundManagerRef.current && player) {
      roundManagerRef.current.player = player;
    }
  }, [player]); // This runs every time the player state changes

  // Callback function to link RoundManager back to React state
  const onRoundStateChange = useCallback((newState: any) => {
    if (newState.roundState !== undefined) {
      setRoundState(newState.roundState);
      if (newState.roundState === RoundState.End) {
        const enemies = roundManagerRef.current?.roundDef?.enemies;
        if (enemies) {
          setDefeatedEnemies(enemies);
        }
      }
    }
    if (newState.currentRound !== undefined)
      setCurrentRound(newState.currentRound);
    if (newState.isGameActive !== undefined)
      setIsGameActive(newState.isGameActive);
    if (newState.playerGold !== undefined) {
      setPlayer((p) => (p ? { ...p, gold: newState.playerGold } : undefined));
    }
  }, []);

  useEffect(() => {
    if (
      isLoaded &&
      unitManagerRef.current &&
      gameObjectManagerRef.current &&
      placementRef.current &&
      sceneRef.current &&
      worldRef.current &&
      projectileManagerRef.current
    ) {
      console.log("setting up round manager");
      roundManagerRef.current = new RoundManager(
        unitManagerRef.current,
        gameObjectManagerRef.current,
        placementRef.current,
        sceneRef.current,
        worldRef.current,
        projectileManagerRef.current,
        onRoundStateChange
      );
    }
  }, [
    isLoaded,
    onRoundStateChange,
    worldRef,
    unitManagerRef,
    gameObjectManagerRef,
    placementRef,
    threeScene,
    projectileManagerRef,
  ]);

  // Load Map and Collision

  useMapManager(
    threeScene,
    worldRef,
    gameObjectManagerRef,
    currentMap,
    isLoaded
  );

  // Main Game Render Loop - now calls roundManager.update()
  useGameLoop(
    threeScene,
    worldRef.current,
    gameObjectManagerRef.current,
    unitManagerRef.current,
    roundManagerRef.current,
    isGameActive,
    false
  );

  useRaycaster(
    threeScene,
    worldRef,
    gameObjectManagerRef,
    roundState,
    placementRef
  );

  const maxUnits =
    placementRef.current && player
      ? getMaxUnits(placementRef.current.getGridTiles())
      : 0;
  const sceneRef = useRef(threeScene?.scene);
  if (threeScene) {
    sceneRef.current = threeScene.scene;
  }

  // Game actions now delegate to the RoundManager
  const startGame = () => {
    if (isLoaded && roundManagerRef.current) {
      const newPlayer = { id: 1, gold: 100, items: [], units: [] };
      setPlayer(newPlayer);
      roundManagerRef.current.startGame(newPlayer);
      setIsGameActive(true);
    } else {
      alert("Game assets or systems not ready. Please wait.");
    }
  };

  const startBattlePhase = useCallback(() => {
    if (!player || player.units.length === 0) {
      alert("Place some units before starting the battle!");
      return;
    }
    roundManagerRef.current?.setRoundState(RoundState.Battle);
  }, [player]);

  const handlePurchaseUnit = useCallback(
    (blueprint: UnitBlueprint, tile: GridTile): boolean => {
      // This logic remains largely the same as it directly manipulates the player state and game objects
      if (!player) return false;
      if (!placementRef.current) return false;
      if (player.gold < blueprint.cost) {
        alert("Not enough gold!");
        return false;
      }
      if (player.units.length >= maxUnits && maxUnits > 0) {
        alert("Your board is full!");
        return false;
      }
      if (
        !sceneRef.current ||
        !worldRef.current ||
        !unitManagerRef.current ||
        !gameObjectManagerRef.current ||
        !projectileManagerRef.current
      ) {
        return false;
      }

      const newUnitGameObject = spawnSingleUnit({
        blueprint,
        playerIdToSpawn: player.id,
        scene: sceneRef.current,
        world: worldRef.current,
        unitManager: unitManagerRef.current,
        gameObjectManager: gameObjectManagerRef.current,
        position: tile.position,
        projectileManager: projectileManagerRef.current,
      });

      if (newUnitGameObject) {
        const unit = newUnitGameObject.getComponent(Unit);
        if (unit) {
          placementRef.current.markOccupied(tile.row, tile.col, unit);
        }
        setPlayer((p) => {
          if (!p) return undefined;
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
        });
        return true;
      }
      return false;
    },
    [player, maxUnits]
  );

  const handlePurchaseItem = (item: ItemBlueprint, playerId: number) => {
    setPlayer((prevPlayer) => {
      if (!prevPlayer || prevPlayer.gold < item.cost) {
        return prevPlayer;
      }
      const newPlayer = {
        ...prevPlayer,
        gold: prevPlayer.gold - item.cost,
        items: [...(prevPlayer.items || []), item],
      };
      return newPlayer;
    });
  };
  const handleReroll = (playerId: number) => {
    setPlayer((prevPlayer) => {
      if (!prevPlayer || prevPlayer.gold < 10) {
        return prevPlayer;
      }
      return {
        ...prevPlayer,
        gold: prevPlayer.gold - 10,
      };
    });
  };

  const handleProceedToShop = () => {
    roundManagerRef.current?.proceedToShop();
  };
  const handleEnlistUnit = (unitToEnlist: Unit, avaliableTile: GridTile) => {
    if (
      !player ||
      !sceneRef.current ||
      !worldRef.current ||
      !gameObjectManagerRef.current ||
      !unitManagerRef.current
    )
      return;
    console.log(
      `Player ${player.id} enlisted ${unitToEnlist.blueprint.name}! at (${avaliableTile.row},${avaliableTile.col}`
    );

    const newUnitGameObject = spawnSingleUnit({
      blueprint: unitToEnlist.blueprint,
      playerIdToSpawn: player.id,
      scene: sceneRef.current,
      world: worldRef.current,
      unitManager: unitManagerRef.current,
      gameObjectManager: gameObjectManagerRef.current,
      position: avaliableTile.position,
      projectileManager: projectileManagerRef.current,
    });

    if (newUnitGameObject && placementRef.current) {
      const unit = newUnitGameObject.getComponent(Unit);
      if (unit) {
        placementRef.current.markOccupied(
          avaliableTile.row,
          avaliableTile.col,
          unit
        );
      }
      setPlayer((p) => {
        if (!p) return undefined;
        return {
          ...p,
          units: [
            ...p.units,
            {
              id: newUnitGameObject.name,
              blueprintName: unitToEnlist.blueprint.name,
              gameObject: newUnitGameObject,
            },
          ],
        };
      });
    }
  };

  const handleEndShopPhase = () => {
    roundManagerRef.current?.endShopPhase();
  };

  // Helper to convert enum to string for UI
  const getRoundStateName = (
    state: RoundState
  ): "setup" | "battle" | "end" | "shop" | "inactive" | "enlist" => {
    return RoundState[state].toLowerCase() as any;
  };

  return (
    <div ref={containerRef} className="game-container">
      <GameUI
        currentRound={currentRound}
        roundState={getRoundStateName(roundState)}
        players={player ? [player] : []}
        maxUnits={maxUnits}
        isLoaded={isLoaded}
        isGameActive={isGameActive}
        onStartGame={startGame}
        onStartBattlePhase={startBattlePhase}
        onEndShopPhase={handleEndShopPhase}
      />

      {isGameActive && roundState === RoundState.Enlist && (
        <EnlistScene
          enemies={defeatedEnemies}
          placementRef={placementRef}
          onProceed={handleProceedToShop}
          onEnlist={handleEnlistUnit}
        />
      )}

      {isGameActive && roundState === RoundState.Shop && (
        <ShopMenuContainer
          players={player ? [player] : []}
          isGameActive={isGameActive}
          roundState={getRoundStateName(roundState)}
          placementRef={placementRef}
          maxUnitsPerPlayer={maxUnits}
          onPurchaseUnit={(blueprint, tile) =>
            handlePurchaseUnit(blueprint, tile)
          }
          onPurchaseItem={handlePurchaseItem}
          onReroll={handleReroll}
        />
      )}

      {threeScene && isLoaded && (
        <UnitPlacementSystem
          ref={placementRef}
          scene={threeScene.scene}
          position={placementSystemPosition}
          tileSize={2}
          gridSize={6}
        />
      )}

      {isGameActive && roundState === RoundState.Setup && (
        <BuyMenuContainer
          players={player ? [player] : []}
          isGameActive={isGameActive}
          roundState={getRoundStateName(roundState)}
          placementRef={placementRef}
          maxUnitsPerPlayer={maxUnits}
          onPurchaseUnit={(blueprint, tile) =>
            handlePurchaseUnit(blueprint, tile)
          }
        />
      )}
    </div>
  );
};

export default AutoBattler;
