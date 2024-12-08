import { FC, KeyboardEvent, useCallback, useEffect, useState } from "react";
import { colAsLabel, rowColFromCellId } from "../utils";
import { FxIcon } from "./icons/FxIcon";
import { CellId, Sheet } from "../models";
import { cellId } from "../parser";

type CellIdInputProps = {
  focusedCell: CellId;
  setFocusedCell: (cellId: CellId) => void;
};

const CellIdInput = ({ focusedCell, setFocusedCell }: CellIdInputProps) => {
  const { row: focusedCellRow, col: focusedCellCol } =
    rowColFromCellId(focusedCell);
  const [internalFocusedCell, setInternalFocusedCell] = useState(
    `${colAsLabel(focusedCellCol)}${focusedCellRow}`
  );

  useEffect(() => {
    setInternalFocusedCell(`${colAsLabel(focusedCellCol)}${focusedCellRow}`);
  }, [focusedCell]);

  const onKeyDownHandler = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") event.currentTarget.blur();
    },
    []
  );

  const onBlurHandler = () => {
    const [result] = cellId(internalFocusedCell);
    if (result.ok) {
      setFocusedCell(result.value.join("").toUpperCase());
    }
  };

  return (
    <div className="w-[106px] h-full text-xs px-1.5 py-1">
      <input
        className="w-full h-full px-2 text-sm focus:outline-none rounded hover:bg-[#EDEDED] focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-transparent focus:rounded-none"
        value={internalFocusedCell}
        onChange={(e) => setInternalFocusedCell(e.target.value)}
        onBlur={onBlurHandler}
        onKeyDown={onKeyDownHandler}
      />
    </div>
  );
};

const Separator = () => <div className="w-px h-4 bg-[#C7C7C7]"></div>;

type FormulaInputProps = {
  sheet: Sheet<number>;
  focusedCell: CellId;
};

const FormulaInput: FC<FormulaInputProps> = ({
  sheet: _sheet,
  focusedCell: _focusedCell,
}) => {
  return (
    <>
      <div className="flex w-[33.75px] justify-center items-center h-full">
        <FxIcon />
      </div>
      <input className="flex-1 h-full pr-2 text-xs focus:outline-none" />
    </>
  );
};

type FormulaBarProps = {
  sheet: Sheet<number>;
  focusedCell: CellId;
  setFocusedCell: (cellId: CellId) => void;
};

export const FormulaBar: FC<FormulaBarProps> = ({
  sheet,
  focusedCell,
  setFocusedCell,
}) => {
  return (
    <div className="w-full h-[29px] flex items-center">
      <CellIdInput focusedCell={focusedCell} setFocusedCell={setFocusedCell} />
      <Separator />
      <FormulaInput sheet={sheet} focusedCell={focusedCell} />
    </div>
  );
};
