import "./App.css";
import { Cell, SheetType, colAsLabel, evaluateFormula } from "./utils";
import { createMemo } from "./signals";

const COLS = 5;
const ROWS = 15;
const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }));

class Sheet<T> {
  cells: Cell<T>[];

  constructor(cells: Cell<T>[] = []) {
    this.cells = cells;
  }

  insert(cell: Cell<T>) {
    this.cells.push(cell);
  }

  get(id: Cell<T>["cellId"]): Cell<T> | null {
    let low = 0;
    let high = this.cells.length - 1;
    let mid;
    let middleEl;
    while (low <= high) {
      mid = Math.floor(low + high / 2);
      middleEl = this.cells[mid];

      if (middleEl.cellId === id) {
        return middleEl;
      } else if (middleEl.cellId < id) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return null;
  }

  getOrDefault(id: Cell<T>["cellId"]) {
    return (
      this.get(id) || {
        cellId: id,
        originalContent: "",
        computed: createMemo(() => 0),
      }
    );
  }
}

const sheet: SheetType = {};

function App() {
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
                const cellId = (
                  colAsLabel(colIndex + 1) + String(rowIndex + 1)
                ).toUpperCase();
                const cell = sheet[cellId];
                if (cell) {
                  event.target.value = cell.originalContent;
                }
                event.target.select();
              }}
              onBlur={(event) => {
                if (event.target.value === "") return;

                const cellId = (
                  colAsLabel(colIndex + 1) + String(rowIndex + 1)
                ).toUpperCase();
                const cell = sheet[cellId];

                const formula = event.target.value;
                const updateFn = event.target.value.startsWith("=")
                  ? () => {
                      const value = evaluateFormula(sheet, formula);
                      event.target.value = value;
                      return value;
                    }
                  : () => {
                      const value = Number(formula);
                      event.target.value = String(value);
                      return value;
                    };

                if (!cell) {
                  sheet[cellId] = {
                    cellId,
                    originalContent: formula,
                    computed: createMemo(updateFn),
                  };
                } else {
                  cell.originalContent = formula;
                  cell.computed.set(updateFn);
                }
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;
