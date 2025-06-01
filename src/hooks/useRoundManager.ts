import { useEffect, useRef, useCallback } from "react";
import { UnitManager } from "../units/UnitManager";
import { Player } from "../types/gameTypes";
import { ENEMY_TEAM_ID, spawnEnemyWave } from "../gameLogic/enemySpawner";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { UnitPlacementSystemHandle } from "@/components/UnitPlacementSystem";
import { Scene } from "three";
import { World } from "@dimforge/rapier3d";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { getWaveDefinition } from "../gameLogic/waveDefinitions";

const SETUP_TIME = 30;
const BATTLE_TIME = 60;
const END_TIME = 5;

const calculateBudget = (round: number) => 2 + (round - 1);

type RoundState = "setup" | "battle" | "end";

export const useRoundManager = (
  isGameActive: boolean,
  setIsGameActive: React.Dispatch<React.SetStateAction<boolean>>,
  roundState: RoundState,
  setRoundState: React.Dispatch<React.SetStateAction<RoundState>>,
  currentRound: number,
  setCurrentRound: React.Dispatch<React.SetStateAction<number>>,
  roundTimer: number,
  setRoundTimer: React.Dispatch<React.SetStateAction<number>>,
  player: Player | undefined,
  setPlayer: React.Dispatch<React.SetStateAction<Player | undefined>>,
  unitManagerRef: React.RefObject<UnitManager | null>,
  gameObjectManagerRef: React.RefObject<GameObjectManager | null>,
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>,
  sceneRef: React.RefObject<Scene | null>,
  worldRef: React.RefObject<World | null>,
  projectileManagerRef: React.RefObject<ProjectileManager | null>
) => {
  const hasSpawnedEnemies = useRef(false);
  const hasProcessedBattleOutcome = useRef(false);
  const hasHandledEndPhase = useRef(false);

  const resetPhaseFlags = () => {
    hasSpawnedEnemies.current = false;
    hasProcessedBattleOutcome.current = false;
    hasHandledEndPhase.current = false;
  };

  const determineBattleOutcome = useCallback((): boolean => {
    const manager = unitManagerRef.current;
    if (!manager || !player) return false;
    const playerAlive = manager.getAliveUnits(player.id);
    const enemyAlive = manager.getAliveUnits(ENEMY_TEAM_ID);
    return playerAlive > 0 && enemyAlive === 0;
  }, [player, unitManagerRef]);

  // Main game loop
  useEffect(() => {
    if (!isGameActive || !player) return;

    const interval = setInterval(() => {
      setRoundTimer((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          switch (roundState) {
            case "setup":
              resetPhaseFlags();
              setRoundState("battle");
              return BATTLE_TIME;

            case "battle": {
              if (!hasProcessedBattleOutcome.current) {
                hasProcessedBattleOutcome.current = true;
                const won = determineBattleOutcome();
                player.lastBattleWon = won; // set on object directly or use `setPlayer`
              }
              setRoundState("end");
              return END_TIME;
            }

            case "end": {
              if (hasHandledEndPhase.current) return 0;
              hasHandledEndPhase.current = true;

              unitManagerRef.current?.clearAllUnits();
              setPlayer((prev) =>
                prev ? { ...prev, units: [] } : undefined
              );

              if (player.lastBattleWon) {
                const goldReward = getWaveDefinition(currentRound)?.goldReward || 10 * currentRound;
                setPlayer((prev) =>
                  prev ? { ...prev, gold: prev.gold + goldReward } : undefined
                );
                const nextRound = currentRound + 1;
                setCurrentRound(nextRound);
                resetPhaseFlags();
                setRoundState("setup");
                return SETUP_TIME;
              } else {
                setIsGameActive(false);
                alert(`Game Over! You reached Round ${currentRound}.`);
                return 0;
              }
            }

            default:
              return 0;
          }
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isGameActive,
    roundState,
    currentRound,
    player,
    setRoundTimer,
    setRoundState,
    setCurrentRound,
    setIsGameActive,
    setPlayer,
    determineBattleOutcome,
    unitManagerRef,
  ]);

  // Spawn enemies during setup
  useEffect(() => {
    if (
      roundState === "setup" &&
      !hasSpawnedEnemies.current &&
      isGameActive &&
      player &&
      unitManagerRef.current &&
      gameObjectManagerRef.current &&
      placementRef.current &&
      sceneRef.current &&
      worldRef.current &&
      projectileManagerRef.current
    ) {
      spawnEnemyWave({
        budget: calculateBudget(currentRound),
        currentRound,
        unitManager: unitManagerRef.current,
        gameObjectManager: gameObjectManagerRef.current,
        placementRef: placementRef,
        scene: sceneRef.current,
        world: worldRef.current,
        projectileManager: projectileManagerRef.current,
      });
      hasSpawnedEnemies.current = true;
    }
  }, [
    roundState,
    isGameActive,
    currentRound,
    player,
    unitManagerRef,
    gameObjectManagerRef,
    placementRef,
    sceneRef,
    worldRef,
    projectileManagerRef,
  ]);

  // Start battle units
  useEffect(() => {
    if (roundState === "battle" && unitManagerRef.current) {
      unitManagerRef.current.setTargets();
      unitManagerRef.current.playAllUnits();
    }
  }, [roundState, unitManagerRef]);

  // Early battle end detection
  useEffect(() => {
    if (
      roundState !== "battle" ||
      !isGameActive ||
      !player ||
      !unitManagerRef.current
    )
      return;

    const checkEarlyWin = () => {
      if (hasProcessedBattleOutcome.current) return;
      const manager = unitManagerRef.current;
      const playerAlive = manager?.getAliveUnits(player.id) ?? 0;
      const enemyAlive = manager?.getAliveUnits(ENEMY_TEAM_ID) ?? 0;
      if (playerAlive === 0 || enemyAlive === 0) {
        hasProcessedBattleOutcome.current = true;
        const won = playerAlive > 0 && enemyAlive === 0;
        player.lastBattleWon = won;
        setRoundTimer(0);
      }
    };

    const id = setInterval(checkEarlyWin, 500);
    return () => clearInterval(id);
  }, [roundState, isGameActive, player, unitManagerRef, setRoundTimer]);
};
