import "./DisplaySheet.css";
import { colAsLabel, getCellIdFromRowCol } from "../utils";
import { createMemo } from "../signals";
import { Sheet } from "../models";
import { FocusEvent, useCallback } from "react";

const COLS = 10;
const ROWS = 20;
const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }));

export function DisplaySheet({ sheet }: { sheet: Sheet<number> }) {
  const focusHandler = useCallback(
    (rowIndex: number, colIndex: number) =>
      (event: FocusEvent<HTMLInputElement>) => {
        const cellId = getCellIdFromRowCol(rowIndex, colIndex);
        const cell = sheet.get(cellId);
        if (cell) {
          event.target.value = cell.originalContent;
        }
        event.target.select();
      },
    [sheet]
  );

  const blurHandler =
    (rowIndex: number, colIndex: number) =>
    (event: FocusEvent<HTMLInputElement>) => {
      const cellId = getCellIdFromRowCol(rowIndex, colIndex);
      const cell = sheet.get(cellId);

      const originalContents = event.target.value;
      const updateFn = event.target.value.startsWith("=")
        ? () => {
            const value = sheet.evaluateFormula(originalContents);
            event.target.value = String(value);
            return value;
          }
        : () => {
            const value = Number(originalContents);
            event.target.value = String(value);
            return value;
          };

      if (!cell) {
        if (originalContents === "") return;
        sheet.insert({
          cellId,
          originalContent: originalContents,
          computed: createMemo(updateFn),
        });
      } else {
        cell.originalContent = originalContents;
        originalContents === ""
          ? cell.computed.set(() => 0)
          : cell.computed.set(updateFn);
      }
    };

  return (
    <div className="sheet">
      <div className="grid-row">
        <div className="grid-number-label" />
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <div className="grid-letter-label" key={colIndex}>
            {colAsLabel(colIndex + 1)}
          </div>
        ))}
      </div>
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          <div className="grid-number-label">{rowIndex + 1}</div>
          {row.map((_, colIndex) => (
            <input
              type="text"
              key={`${colIndex}${rowIndex}`}
              className="grid-cell"
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              onFocus={focusHandler(rowIndex, colIndex)}
              onBlur={blurHandler(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
