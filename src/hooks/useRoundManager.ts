import { useEffect, useRef, useCallback } from "react";
import { Player } from "../types/gameTypes";
import { ENEMY_TEAM_ID, spawnEnemyWave } from "../gameLogic/enemySpawner";
import { getWaveDefinition } from "../gameLogic/waveDefinitions";
import { GameSystems } from "@/types/gameTypes";

const BATTLE_TIME = 60;
const END_TIME = 5;

const calculateBudget = (round: number) => 2 + round - 1;

type RoundState = "setup" | "battle" | "end";

const systemsReady = (
  systems: Partial<GameSystems>
): systems is GameSystems => {
  return (
    !!systems.unitManager &&
    !!systems.gameObjectManager &&
    !!systems.placementSystem &&
    !!systems.scene &&
    !!systems.world &&
    !!systems.projectileManager
  );
};

export const useRoundManager = (
  isGameActive: boolean,
  roundState: RoundState,
  currentRound: number,
  player: Player | undefined,
  systems: Partial<GameSystems>,
  stateSetters: {
    setIsGameActive: React.Dispatch<React.SetStateAction<boolean>>;
    setRoundState: React.Dispatch<React.SetStateAction<RoundState>>;
    setCurrentRound: React.Dispatch<React.SetStateAction<number>>;
    setRoundTimer: React.Dispatch<React.SetStateAction<number>>;
    setPlayer: React.Dispatch<React.SetStateAction<Player | undefined>>;
  }
) => {
  const {
    setIsGameActive,
    setRoundState,
    setCurrentRound,
    setRoundTimer,
    setPlayer,
  } = stateSetters;

  const hasSpawnedEnemies = useRef(false);
  const hasProcessedBattleOutcome = useRef(false);
  const hasHandledEndPhase = useRef(false);

  const resetPhaseFlags = () => {
    hasSpawnedEnemies.current = false;
    hasProcessedBattleOutcome.current = false;
    hasHandledEndPhase.current = false;
  };

  const determineBattleOutcome = useCallback((): boolean => {
    if (!systemsReady(systems) || !player) return false;
    const playerAlive = systems.unitManager.getAliveUnits(player.id);
    const enemyAlive = systems.unitManager.getAliveUnits(ENEMY_TEAM_ID);
    return playerAlive > 0 && enemyAlive === 0;
  }, [player, systems]);

  // Main game loop for "battle" and "end" phases
  useEffect(() => {
    if (!isGameActive || !player || roundState === "setup") {
      return;
    }

    const interval = setInterval(() => {
      setRoundTimer((prev) => {
        const next = prev - 1;
        if (next > 0) return next;

        // Timer has hit zero, transition to the next phase
        switch (roundState) {
          case "battle": {
            setRoundState("end");
            return END_TIME;
          }

          case "end": {
            if (hasHandledEndPhase.current) return 0;
            hasHandledEndPhase.current = true;

            const won = determineBattleOutcome();

            if (systems.unitManager) {
              systems.unitManager.clearAllUnits();
            }

            if (won) {
              // Player won: update gold, go to next round, and return to setup
              setPlayer((p) => {
                if (!p) return undefined;
                const goldReward =
                  getWaveDefinition(currentRound)?.goldReward ||
                  10 * currentRound;
                return { ...p, units: [], gold: p.gold + goldReward };
              });
              setCurrentRound((r) => r + 1);
              resetPhaseFlags();
              setRoundState("setup");
            } else {
              // Player lost: end the game
              setIsGameActive(false);
              alert(`Game Over! You reached Round ${currentRound}.`);
            }
            return 0; // Stop the timer
          }
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isGameActive,
    roundState,
    currentRound,
    player,
    systems,
    determineBattleOutcome,
    ...Object.values(stateSetters),
  ]);

  // Spawn enemies during setup
  useEffect(() => {
    if (
      roundState === "setup" &&
      !hasSpawnedEnemies.current &&
      isGameActive &&
      player &&
      systemsReady(systems)
    ) {
      
      spawnEnemyWave({
        budget: calculateBudget(currentRound),
        currentRound: currentRound,
        systems,
      });
      hasSpawnedEnemies.current = true;
    }
  }, [roundState, isGameActive, player, systems, currentRound]);

  // Start battle units
  useEffect(() => {
    if (roundState === "battle" && systems.unitManager) {
      systems.unitManager.setTargets();
      systems.unitManager.playAllUnits();
    }
  }, [roundState, systems.unitManager]);

  // Early battle end detection
  useEffect(() => {
    if (
      roundState !== "battle" ||
      !isGameActive ||
      !player ||
      !systemsReady(systems)
    )
      return;

    const checkEarlyWin = () => {
      if (hasProcessedBattleOutcome.current) return;

      const playerAlive = systems.unitManager.getAliveUnits(player.id) ?? 0;
      const enemyAlive = systems.unitManager.getAliveUnits(ENEMY_TEAM_ID) ?? 0;

      if (playerAlive === 0 || enemyAlive === 0) {
        hasProcessedBattleOutcome.current = true;
        setRoundTimer(0); // Trigger phase transition immediately
      }
    };

    const id = setInterval(checkEarlyWin, 500);
    return () => clearInterval(id);
  }, [roundState, isGameActive, player, systems, setRoundTimer]);
};
