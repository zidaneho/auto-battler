import { useEffect, useState, useCallback, useRef } from "react"; // Added useState and useRef
import { UnitManager } from "../units/UnitManager";
import { Player } from "../types/gameTypes";
import { ENEMY_TEAM_ID, spawnEnemyWave } from "../gameLogic/enemySpawner"; // Import spawnEnemyWave
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { UnitPlacementSystemHandle } from "@/components/UnitPlacementSystem";
import { Scene } from "three";
import { World } from "@dimforge/rapier3d";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { getWaveDefinition } from "../gameLogic/waveDefinitions";

// Helper function to calculate budget (can be moved to a separate file if complex)
const calculateBudgetForWave = (round: number): number => {
  const baseBudget = 2; // Min budget
  const budgetPerRound = 1;
  return baseBudget + (round - 1) * budgetPerRound;
};

export const useRoundManager = (
  isGameActive: boolean,
  roundState: "setup" | "battle" | "end",
  setRoundState: React.Dispatch<
    React.SetStateAction<"setup" | "battle" | "end">
  >,
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
  projectileManagerRef: React.RefObject<ProjectileManager | null>,
  setIsGameActive: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const SETUP_TIME = 30; // seconds
  const BATTLE_TIME = 60; // seconds
  const END_PHASE_TIME = 5; // seconds

  const [hasSpawnedForCurrentSetup, setHasSpawnedForCurrentSetup] =
    useState(false);
  // Ref to track if the outcome for the current "end" phase has been processed
  const outcomeProcessedThisEndPhaseRef = useRef(false);

  // Effect for managing round timers and state transitions
  useEffect(() => {
    if (!isGameActive || !player) return;

    let intervalId: NodeJS.Timeout | undefined;

    if (roundState === "battle") {
      if (unitManagerRef.current) {
        console.log(
          "Round Manager: Setting targets and playing all units for battle."
        );
        unitManagerRef.current.setTargets();
        unitManagerRef.current.playAllUnits();
      }
    }

    if (roundState === "setup" || roundState === "battle") {
      intervalId = setInterval(() => {
        setRoundTimer((prev) => {
          if (prev <= 1) {
            if (roundState === "setup") {
              console.log(
                "Round Manager: Setup time ended. Transitioning to Battle."
              );
              setRoundState("battle");
              return BATTLE_TIME;
            } else if (roundState === "battle") {
              console.log(
                "Round Manager: Battle time ended. Transitioning to End phase."
              );
              setRoundState("end");
              return END_PHASE_TIME;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    roundState,
    isGameActive,
    player,
    setRoundTimer,
    setRoundState,
    unitManagerRef,
    BATTLE_TIME,
    END_PHASE_TIME,
  ]);

  // Effect to reset spawn and outcome flags when entering a new setup phase
  useEffect(() => {
    if (roundState === "setup") {
      console.log(
        `Round Manager: Entering Setup for Round ${currentRound}. Resetting flags.`
      );
      setHasSpawnedForCurrentSetup(false);
      outcomeProcessedThisEndPhaseRef.current = false; // Reset outcome processed flag
    }
  }, [roundState, currentRound]);

  // Effect for Spawning Enemies during Setup Phase
  useEffect(() => {
    if (
      isGameActive &&
      roundState === "setup" &&
      player &&
      !hasSpawnedForCurrentSetup
    ) {
      if (
        sceneRef.current &&
        worldRef.current &&
        unitManagerRef.current &&
        gameObjectManagerRef.current &&
        placementRef.current
      ) {
        console.log(
          `Round Manager: Spawning enemies for Round ${currentRound} (Setup Phase).`
        );
        const budget = calculateBudgetForWave(currentRound);
        spawnEnemyWave({
          budget,
          currentRound,
          scene: sceneRef.current,
          world: worldRef.current,
          unitManager: unitManagerRef.current,
          gameObjectManager: gameObjectManagerRef.current,
          projectileManager: projectileManagerRef.current,
          placementRef: placementRef,
        });
        setHasSpawnedForCurrentSetup(true);
      } else {
        console.warn(
          "Round Manager: Missing critical refs, cannot spawn enemies during setup."
        );
      }
    }
  }, [
    isGameActive,
    roundState,
    currentRound,
    player,
    hasSpawnedForCurrentSetup,
    sceneRef,
    worldRef,
    unitManagerRef,
    gameObjectManagerRef,
    projectileManagerRef,
    placementRef,
  ]);

  // Effect for handling the end of a round (win/loss, cleanup, next round)
  useEffect(() => {
    // Ensure this logic only runs once per "end" phase instance
    if (
      roundState !== "end" ||
      !isGameActive ||
      !player ||
      outcomeProcessedThisEndPhaseRef.current
    ) {
      return;
    }

    console.log(
      `Round Manager: Round ${currentRound} ended. Determining outcome.`
    );
    outcomeProcessedThisEndPhaseRef.current = true; // Mark outcome as being processed

    let playerWon = false;
    if (unitManagerRef.current && player) {
      // Ensure player is defined
      const allUnits = unitManagerRef.current.getAllUnits();
      const playerUnitsAlive = allUnits.filter(
        (u) => u.teamId === player.id && u.healthComponent?.isAlive()
      ).length;
      const enemyUnitsAlive = allUnits.filter(
        (u) => u.teamId === ENEMY_TEAM_ID && u.healthComponent?.isAlive()
      ).length;

      console.log(
        `Player units alive: ${playerUnitsAlive}, Enemy units alive: ${enemyUnitsAlive}`
      );

      if (playerUnitsAlive > 0 && enemyUnitsAlive === 0) {
        playerWon = true;
      } else {
        // Covers playerUnitsAlive === 0 OR (playerUnitsAlive > 0 && enemyUnitsAlive > 0)
        playerWon = false;
      }
    } else {
      console.warn(
        "Round Manager: UnitManager or Player not available for win/loss check during 'end' phase. Assuming loss."
      );
      playerWon = false; // Default to loss if refs are missing
    }

    // Clear units from the board and manager (happens before win/loss specific actions)
    // This state update will cause a re-render, but outcomeProcessedThisEndPhaseRef.current will prevent re-processing.
    if (unitManagerRef.current && gameObjectManagerRef.current) {
      console.log("Round Manager: Clearing all units from board.");
      unitManagerRef.current.getAllUnits().forEach((unit) => {
        if (unit.gameObject) {
          unit.gameObject.markedForRemoval = true;
        }
      });
      unitManagerRef.current.clearAllUnits();
    }
    // Clear units from player state
    setPlayer((prevPlayer) =>
      prevPlayer ? { ...prevPlayer, units: [] } : undefined
    );

    if (playerWon) {
      console.log(`Round Manager: Player won Round ${currentRound}.`);
      const waveDef = getWaveDefinition(currentRound);
      const goldReward = waveDef?.goldReward || 10 * currentRound;

      // Award gold - this setPlayer call will also trigger a re-render.
      setPlayer((prevPlayer) =>
        prevPlayer
          ? { ...prevPlayer, gold: prevPlayer.gold + goldReward }
          : undefined
      );

      const nextRoundTimeoutId = setTimeout(() => {
        setCurrentRound((r) => r + 1);
        setRoundState("setup"); // This will trigger the useEffect to reset outcomeProcessedThisEndPhaseRef
        setRoundTimer(SETUP_TIME);
        console.log(`Round Manager: Starting Round ${currentRound + 1} Setup.`);
      }, END_PHASE_TIME * 1000);

      return () => clearTimeout(nextRoundTimeoutId);
    } else {
      console.log(
        `Round Manager: Player lost Round ${currentRound}. Game Over.`
      );
      alert(`Game Over! You reached Round ${currentRound}.`);
      setIsGameActive(false);
    }
  }, [
    roundState, // Primary trigger
    isGameActive,
    player,
    currentRound,
    unitManagerRef,
    gameObjectManagerRef,
    setPlayer,
    setCurrentRound,
    setRoundState,
    setRoundTimer,
    setIsGameActive,
    SETUP_TIME,
    END_PHASE_TIME,
    // outcomeProcessedThisEndPhaseRef is a ref, not needed in deps
  ]);
};
