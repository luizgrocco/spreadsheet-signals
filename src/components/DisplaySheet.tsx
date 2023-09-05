import "./DisplaySheet.css";
import { colAsLabel, getCellIdFromRowCol } from "../utils";
import { createMemo } from "../signals";
import { Sheet } from "../models";

const COLS = 10;
const ROWS = 20;
const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }));

export function DisplaySheet({ sheet }: { sheet: Sheet<number> }) {
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
              key={`${rowIndex}${colIndex}`}
              className="grid-cell"
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              onFocus={(event) => {
                const cellId = getCellIdFromRowCol(rowIndex, colIndex);
                const cell = sheet.get(cellId);
                if (cell) {
                  event.target.value = cell.originalContent;
                }
                event.target.select();
              }}
              onBlur={(event) => {
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
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
