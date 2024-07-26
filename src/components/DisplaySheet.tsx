import { useState } from "react";
import Virtualizer from "./Virtualizer";
import { FxIcon } from "./icons/FxIcon";
import { colAsLabel } from "../utils";

export const DisplaySheet = () => {
  const [focusedCell, setFocusedCell] = useState<[number, number]>([1, 1]);
  const [focusedCellRow, focusedCellCol] = focusedCell;

  return (
    <div className="w-full h-full flex justify-center flex-col">
      <div className="w-full h-[143px] flex flex-col">
        <div className="w-full flex-1 bg-[#F9FBFD]"></div>
        <div className="w-full h-[29px] flex items-center">
          <div className="w-24">{`${colAsLabel(focusedCellCol)}${focusedCellRow}`}</div>
          <div className="w-px h-4 bg-[#C7C7C7]"></div>
          <div className="flex">
            <FxIcon />
          </div>
        </div>
      </div>
      <Virtualizer focusedCell={focusedCell} setFocusedCell={setFocusedCell} />
      <div className="h-[36px]"></div>
    </div>
  );
};
