// src/components/AutoBattler.tsx

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
import * as TWEEN from "@tweenjs/tween.js";

// ECS, Units, Physics, etc.
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { UnitManager } from "@/units/UnitManager";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
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
import EnlistScene from "./EnlistScene";
import ShopMenuContainer from "./ShopMenuContainer";
import RandomUnitShop from "./RandomUnitShop";
import UnitStatPanel from "./UnitStatPanel";

// Game Logic
import { spawnSingleUnit } from "@/units/unitActions";

// Types
import { Player } from "@/types/gameTypes";
import { getNormalizedCoordinates, useRaycaster } from "@/hooks/useRaycaster";
import { Unit } from "@/units/Unit";
import { RoundManager, RoundState } from "@/gameLogic/roundManager";
import { ItemBlueprint } from "@/items/ItemBlueprint";
import { BaseItemComponent } from "@/items/BaseItemComponent";

const AutoBattler: React.FC = () => {
  // State management
  const [player, setPlayer] = useState<Player | undefined>(undefined);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<RoundState>(RoundState.Inactive);
  const [defeatedEnemies, setDefeatedEnemies] = useState<Unit[]>([]);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemBlueprint | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Refs for systems and components
  const containerRef = useRef<HTMLDivElement | null>(null);
  const placementRef = useRef<UnitPlacementSystemHandle | null>(null);
  const roundManagerRef = useRef<RoundManager | null>(null);

  const placementSystemPosition = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    loadGLTFModels(() => {
      setIsLoaded(true);
      console.log("All GLTF models loaded!");
    });
  }, []);

  const { threeScene } = useThreeScene(containerRef, isLoaded);
  const {
    worldRef,
    gameObjectManagerRef,
    unitManagerRef,
    projectileManagerRef,
  } = usePhysicsWorld(threeScene, isLoaded);

  useEffect(() => {
    if (roundManagerRef.current && player) {
      roundManagerRef.current.player = player;
    }
  }, [player]);

  const onRoundStateChange = useCallback((newState: any) => {
    if (newState.roundState !== undefined) {
      setRoundState(newState.roundState);
      if (newState.roundState === RoundState.End) {
        const enemies = roundManagerRef.current?.roundDef?.enemies;
        if (enemies) {
          setDefeatedEnemies(enemies.map((e) => e.unit));
        }
      }
      if (newState.roundState === RoundState.Battle) {
        setSelectedUnit(null);
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
      threeScene?.scene &&
      worldRef.current &&
      projectileManagerRef.current
    ) {
      roundManagerRef.current = new RoundManager(
        unitManagerRef.current,
        gameObjectManagerRef.current,
        placementRef.current,
        threeScene.scene,
        worldRef.current,
        projectileManagerRef.current,
        onRoundStateChange
      );
    }
  }, [isLoaded, onRoundStateChange, threeScene]);

  useMapManager(
    threeScene,
    worldRef,
    gameObjectManagerRef,
    "prototypeMap",
    isLoaded
  );

  useGameLoop(
    threeScene,
    worldRef.current,
    gameObjectManagerRef.current,
    unitManagerRef.current,
    roundManagerRef.current,
    isGameActive,
    false
  );

  const handleUnitSelect = (unit: Unit | null) => {
    setSelectedUnit(unit);

    // The camera panning logic that was here has been removed.
  };

  useRaycaster(
    threeScene,
    worldRef,
    gameObjectManagerRef,
    roundState,
    placementRef,
    selectedUnit,
    handleUnitSelect
  );

  const maxUnits =
    placementRef.current && player
      ? getMaxUnits(placementRef.current.getGridTiles())
      : 0;

  const startGame = () => {
    if (isLoaded && roundManagerRef.current) {
      const newPlayer = { id: 1, gold: 10000, items: [], units: [] };
      setPlayer(newPlayer);
      roundManagerRef.current.startGame(newPlayer);
      setIsGameActive(true);
    } else {
      alert("Game assets or systems not ready. Please wait.");
    }
  };

  const handleStartFirstRound = () => {
    if (!player || player.units.length === 0) {
      alert("You must buy at least one unit to start the battle!");
      return;
    }
    roundManagerRef.current?.startFirstRound();
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
      if (
        !player ||
        !placementRef.current ||
        !threeScene?.scene ||
        !worldRef.current ||
        !unitManagerRef.current ||
        !gameObjectManagerRef.current ||
        !projectileManagerRef.current
      ) {
        return false;
      }
      if (player.gold < blueprint.cost) {
        alert("Not enough gold!");
        return false;
      }
      if (player.units.length >= maxUnits && maxUnits > 0) {
        alert("Your board is full!");
        return false;
      }

      const newUnitGameObject = spawnSingleUnit({
        blueprint,
        playerIdToSpawn: player.id,
        scene: threeScene.scene,
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
        setPlayer((p) => ({
          ...p!,
          gold: p!.gold - blueprint.cost,
          units: [
            ...p!.units,
            {
              id: newUnitGameObject.name,
              blueprintName: blueprint.name,
              gameObject: newUnitGameObject,
            },
          ],
        }));
        return true;
      }
      return false;
    },
    [player, maxUnits, threeScene]
  );
  const handlePurchaseItem = (item: ItemBlueprint) => {
    if (!player) return;

    if (player.gold < item.cost) {
      alert("Not enough gold!");
      return;
    }

    setPlayer((p) => ({ ...p!, gold: p!.gold - item.cost }));
    setSelectedItem(item);
  };

  const useItemOnUnit = useCallback(
    (unit: Unit) => {
      if (!selectedItem) return;

      if (selectedItem.type === "consumable" && selectedItem.healAmount) {
        unit.healthComponent.heal(selectedItem.healAmount);
        console.log(`Used ${selectedItem.name} on ${unit.blueprint.name}.`);
      } else if (selectedItem.type === "statStick") {
        unit.gameObject.addComponent(BaseItemComponent, selectedItem);
        console.log(`Equipped ${selectedItem.name} on ${unit.blueprint.name}.`);
      }

      setSelectedItem(null);
    },
    [selectedItem]
  );

  useEffect(() => {
    if (
      !selectedItem ||
      !threeScene ||
      !worldRef.current ||
      !gameObjectManagerRef.current
    )
      return;

    const canvas = threeScene.renderer.domElement;

    const onUnitClick = (event: MouseEvent) => {
      const pointer = getNormalizedCoordinates(canvas, event);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, threeScene.camera);
      const rapierRay = new RAPIER.Ray(
        raycaster.ray.origin,
        raycaster.ray.direction
      );
      const hit = worldRef.current!.castRay(rapierRay, 100, true);

      if (hit?.collider) {
        const gameObject =
          gameObjectManagerRef.current!.getGameObjectFromCollider(
            hit.collider.handle
          );
        if (gameObject) {
          const unit = gameObject.getComponent(Unit);
          if (unit && unit.teamId === player?.id) {
            useItemOnUnit(unit);
          }
        }
      }
    };

    canvas.addEventListener("click", onUnitClick);
    return () => {
      canvas.removeEventListener("click", onUnitClick);
    };
  }, [
    selectedItem,
    threeScene,
    worldRef,
    gameObjectManagerRef,
    player,
    useItemOnUnit,
  ]);

  const handleReroll = () => {
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

  const handleProceedToShop = () => roundManagerRef.current?.proceedToShop();

  const handleEnlistUnit = (unitToEnlist: Unit, availableTile: GridTile) => {
    if (
      !player ||
      !threeScene?.scene ||
      !worldRef.current ||
      !gameObjectManagerRef.current ||
      !unitManagerRef.current ||
      !projectileManagerRef.current
    )
      return;

    const newUnitGameObject = spawnSingleUnit({
      blueprint: unitToEnlist.blueprint,
      playerIdToSpawn: player.id,
      scene: threeScene.scene,
      world: worldRef.current,
      unitManager: unitManagerRef.current,
      gameObjectManager: gameObjectManagerRef.current,
      position: availableTile.position,
      projectileManager: projectileManagerRef.current,
    });

    if (newUnitGameObject && placementRef.current) {
      const unit = newUnitGameObject.getComponent(Unit);
      if (unit) {
        placementRef.current.markOccupied(
          availableTile.row,
          availableTile.col,
          unit
        );
      }
      setPlayer((p) => ({
        ...p!,
        units: [
          ...p!.units,
          {
            id: newUnitGameObject.name,
            blueprintName: unitToEnlist.blueprint.name,
            gameObject: newUnitGameObject,
          },
        ],
      }));
    }
  };

  const handleEndShopPhase = () => roundManagerRef.current?.endShopPhase();
  const getRoundStateName = (state: RoundState) =>
    RoundState[state].toLowerCase() as any;

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
        onStartSetup={handleStartFirstRound}
        onStartBattlePhase={startBattlePhase}
        onEndShopPhase={handleEndShopPhase}
      />

      <UnitStatPanel
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
      />

      {isGameActive && roundState === RoundState.Enlist && (
        <EnlistScene
          enemies={defeatedEnemies}
          placementRef={placementRef}
          onProceed={handleProceedToShop}
          onEnlist={handleEnlistUnit}
        />
      )}

      {isGameActive &&
        roundState === RoundState.Shop &&
        selectedItem === null && (
          <ShopMenuContainer
            players={player ? [player] : []}
            isGameActive={isGameActive}
            roundState={getRoundStateName(roundState)}
            placementRef={placementRef}
            maxUnitsPerPlayer={maxUnits}
            currentRound={currentRound}
            onPurchaseUnit={handlePurchaseUnit}
            onPurchaseItem={handlePurchaseItem}
            onReroll={handleReroll}
          />
        )}

      {selectedItem && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
            textAlign: "center",
            padding: "10px 20px",
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "white", margin: "0 0 10px 0" }}>
            Select a unit to use {selectedItem.name}
          </p>
          <button
            onClick={() => {
              setPlayer((p) => ({ ...p!, gold: p!.gold + selectedItem.cost }));
              setSelectedItem(null);
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#c53030",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
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

      {isGameActive && roundState === RoundState.InitialShop && player && (
        <RandomUnitShop
          player={player}
          onPurchase={handlePurchaseUnit}
          getPlacementSystem={() => placementRef.current}
        />
      )}
    </div>
  );
};

export default AutoBattler;
