import { useEffect } from "react";
import { UnitManager } from "../units/UnitManager"; // Adjust path
// import { GameObjectManager } from "../ecs/GameObjectManager"; // Not directly used for removal here, but for context
import { Player } from "../types/gameTypes"; // Adjust path
import { clearBoardAndUnitsGlobally } from "../gameLogic/playerActions"; // Adjust path

export const useRoundManager = (
  isGameActive: boolean,
  roundState: "setup" | "battle" | "end",
  setRoundState: React.Dispatch<
    React.SetStateAction<"setup" | "battle" | "end">
  >,
  currentRound: number, // Only for logging or display, not directly set by this hook
  setCurrentRound: React.Dispatch<React.SetStateAction<number>>,
  roundTimer: number, // Only for display, not directly set by this hook
  setRoundTimer: React.Dispatch<React.SetStateAction<number>>,
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>,
  unitManagerRef: React.RefObject<UnitManager | null>
  // gameObjectManagerRef: React.RefObject<GameObjectManager | null> // Pass if directly needed by clearBoardAndUnitsGlobally
) => {
  // Round Timer and State Transitions
  useEffect(() => {
    if (!isGameActive) return;

    let intervalId: NodeJS.Timeout | undefined;

    if (roundState === "battle" && unitManagerRef.current) {
      unitManagerRef.current.setTargets();
      unitManagerRef.current.playAllUnits();
    }

    if (roundState === "setup" || roundState === "battle") {
      intervalId = setInterval(() => {
        setRoundTimer((prev) => {
          if (prev <= 1) {
            if (roundState === "setup") {
              setRoundState("battle");
              return 15; // Reset timer for battle (or a config value)
            } else if (roundState === "battle") {
              setRoundState("end");
              return 0; // Timer for end phase (or a config value)
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [roundState, isGameActive, setRoundTimer, setRoundState, unitManagerRef]);

  // End of Round Logic (Cleanup and Next Round Setup)
  useEffect(() => {
    if (roundState !== "end" || !isGameActive) return;

    // Award gold
    setPlayers(
      (prev) => prev.map((p) => ({ ...p, gold: p.gold + 20 })) // Example gold income
    );

    // Clear units from managers and React state
    if (unitManagerRef.current) {
      clearBoardAndUnitsGlobally(unitManagerRef.current, setPlayers);
    }

    // Transition to next round's setup
    const timeoutId = setTimeout(() => {
      setCurrentRound((r) => r + 1);
      setRoundState("setup");
      setRoundTimer(30); // Reset timer for setup (or a config value)
      console.log(`Starting Round ${currentRound + 1} Setup`);
    }, 3000); // Delay before starting next round setup

    return () => clearTimeout(timeoutId);
  }, [
    roundState,
    isGameActive,
    setPlayers,
    setCurrentRound,
    setRoundState,
    setRoundTimer,
    unitManagerRef,
    currentRound,
  ]);
};
