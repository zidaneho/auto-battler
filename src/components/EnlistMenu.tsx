import { Player } from "@/types/gameTypes";
import { Unit } from "@/units/Unit";
import { UnitBlueprint } from "@/units/UnitBlueprint";

interface EnlistMenuProps {
  player: Player;
  blueprintsToEnlist: UnitBlueprint[];
  onEnlist: () => void;
}

const EnlistMenu: React.FC<EnlistMenuProps> = ({
  player,
  blueprintsToEnlist,
  onEnlist,
}) => {
  return (
    <div>
      {blueprintsToEnlist.map((blueprint) => {
        return (
          <button
            key={blueprint.modelKey + "_" + player.id}
            onClick={() => onEnlist()}
            
          ></button>
        );
      })}
    </div>
  );
};
