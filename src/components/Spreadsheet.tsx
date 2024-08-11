import { useState } from "react";
import { Grid } from "./Grid";
import { FormulaBar } from "./FormulaBar";
import { SheetTabBar } from "./SheetTabBar";
import { Sheet } from "../models";

const sheet = new Sheet<number>();

export const Spreadsheet = () => {
  const [focusedCell, setFocusedCell] = useState<[number, number]>([1, 1]);

  return (
    <div className="w-full h-full flex justify-center flex-col">
      <div className="w-full h-[143px] flex flex-col">
        <div className="w-full flex flex-col flex-1 bg-[#F9FBFD]">
          <div className="w-full flex-1"></div>
          <div className="w-full pb-2.5 h-[50px]">
            <div></div>
          </div>
        </div>
        <FormulaBar sheet={sheet} focusedCell={focusedCell} />
      </div>
      <Grid
        sheet={sheet}
        focusedCell={focusedCell}
        setFocusedCell={setFocusedCell}
      />
      <SheetTabBar />
    </div>
  );
};
