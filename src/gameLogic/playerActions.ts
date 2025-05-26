import { UnitManager } from "../units/UnitManager"; // Adjust path
import { GameObjectManager } from "../ecs/GameObjectManager"; // Adjust path
import { Player } from "../types/gameTypes"; // Adjust path

export const clearBoardAndUnitsGlobally = (
  unitManager: UnitManager | null,
  // gameObjectManager: GameObjectManager | null // gameObjectManager.update() handles removal
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
) => {
  if (unitManager) {
    const allUnits = unitManager.getAllUnits();
    allUnits.forEach((unit) => {
      if (unit.gameObject) {
        unit.gameObject.markedForRemoval = true;
      }
    });
    unitManager.clearAllUnits(); // Clears the unit manager's list
  }

  setPlayers((prevPlayers) =>
    prevPlayers.map((p) => ({
      ...p,
      units: [],
      // board: [], // If board state needs clearing
    }))
  );
  console.log("Board and units cleared globally.");
};
