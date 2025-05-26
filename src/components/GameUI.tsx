import React from "react";
import { Player } from "@/types/gameTypes"; // Adjust path

interface GameUIProps {
  currentRound: number;
  roundState: "setup" | "battle" | "end";
  roundTimer: number;
  players: Player[];
  maxUnits: number; // Assuming maxUnits is calculated and passed as a prop
  isLoaded: boolean;
  isGameActive: boolean;
  onStartGame: () => void;
  onStartBattlePhase: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
  currentRound,
  roundState,
  roundTimer,
  players,
  maxUnits,
  isLoaded,
  isGameActive,
  onStartGame,
  onStartBattlePhase,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        color: "#e2e8f0",
        zIndex: 10,
        backgroundColor: "rgba(45, 55, 72, 0.7)",
        padding: "12px",
        borderRadius: "8px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "14px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        minWidth: "250px", // Ensure it has some width
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
          {player.units.length}/{maxUnits > 0 ? maxUnits : "-"}
        </div>
      ))}
      {!isLoaded && <p>Loading assets...</p>}
      {isLoaded && !isGameActive && (
        <button
          onClick={onStartGame}
          style={{
            marginTop: "15px",
            padding: "10px 18px",
            fontSize: "16px",
            backgroundColor: "#38a169", // Green
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
          onClick={onStartBattlePhase}
          style={{
            marginTop: "15px",
            padding: "10px 18px",
            fontSize: "16px",
            backgroundColor: "#dd6b20", // Orange
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
  );
};

export default GameUI;