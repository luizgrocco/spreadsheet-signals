import { FC } from "react";
import { colAsLabel } from "../utils";
import { FxIcon } from "./icons/FxIcon";
import { Sheet } from "../models";

type FormulaBarProps = {
  sheet: Sheet<number>;
  focusedCell: [number, number];
};

export const FormulaBar: FC<FormulaBarProps> = ({ sheet, focusedCell }) => {
  const [focusedCellRow, focusedCellCol] = focusedCell;

  return (
    <div className="w-full h-[29px] flex items-center">
      <div className="w-[106px] h-full text-xs px-1.5 py-1">
        <input
          className="w-full h-full px-2 text-sm focus:outline-none rounded hover:bg-[#EDEDED] focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-transparent focus:rounded-none"
          value={`${colAsLabel(focusedCellCol)}${focusedCellRow}`}
        />
      </div>
      <div className="w-px h-4 bg-[#C7C7C7]"></div>
      <div className="flex w-[33.75px] justify-center items-center h-full">
        <FxIcon />
      </div>
      <input className="flex-1 h-full px-2 text-xs focus:outline-none" />
    </div>
  );
};
