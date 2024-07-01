import { createMemo as createComputed, createMemoType } from "../signals";
import { compareCells, expandRange } from "../utils";

export interface CoordsInterface {
  row: number;
  col: number;
  labelCol?: string;
}

export type Letter = string;
export type ColId = string;
export type RowId = [number, number];
export type CellId = string;
export type CellOrRowColType = CellId | RowId;

type Contents = string;

export type Cell<T> = {
  cellId: CellId;
  originalContent: Contents;
  computed: createMemoType<T>;
};

export class Sheet<T> {
  cells: Cell<T>[];

  constructor(cells: Cell<T>[] = []) {
    this.cells = cells.sort((cellA, cellB) =>
      compareCells(cellA.cellId, cellB.cellId)
    );
  }

  insert(cell: Cell<T>): Cell<T> {
    let i = this.cells.length - 1;
    for (
      ;
      i >= 0 && compareCells(this.cells[i].cellId, cell.cellId) === 1;
      i--
    ) {
      this.cells[i + 1] = this.cells[i];
    }

    this.cells[i + 1] = cell;
    return cell;
  }

  get(id: Cell<T>["cellId"]): Cell<T> | null {
    let low = 0;
    let high = this.cells.length - 1;
    let mid;
    let middleEl;
    while (low <= high) {
      mid = Math.floor((low + high) / 2);
      middleEl = this.cells[mid];

      if (compareCells(id, middleEl.cellId) === 0) {
        return middleEl;
      } else if (compareCells(id, middleEl.cellId) <= -1) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return null;
  }

  getOrDefault(id: Cell<T>["cellId"], defaultCell: Cell<T>): Cell<T> {
    return this.get(id) || this.insert(defaultCell);
  }

  // Excel functions
  private SUM(refs: number[][]) {
    return refs.flat(2).reduce((acc, item) => acc + item, 0);
  }
  private COUNT(refs: number[][]) {
    return refs.flat(2).length;
  }
  private MULT(refs: number[][]) {
    return refs.flat(2).reduce((acc, item) => acc * item, 1);
  }
  private AVG(refs: number[][]) {
    return this.SUM(refs) / this.COUNT(refs);
  }
  private MAX(refs: number[][]) {
    return Math.max(...refs.flat(2));
  }
  private MIN(refs: number[][]) {
    return Math.min(...refs.flat(2));
  }
  private COLS(refs: number[][]) {
    return (refs[0] ?? []).length;
  }
  private ROWS(refs: number[][]) {
    refs.length;
  }

  // Evaluation in Excel context
  private executeInExcelContext = (jsFormula: string): number => {
    // Agregation functions, which must be in the same context as the `eval`.
    const SUM = this.SUM;
    const COUNT = this.COUNT;
    const MULT = this.MULT;
    const AVG = this.AVG;
    const MAX = this.MAX;
    const MIN = this.MIN;
    const COLS = this.COLS;
    const ROWS = this.ROWS;

    const createMemo = createComputed;

    return eval(jsFormula);
  };

  evaluateFormula(formula: string): number {
    const jsFormula = formula
      .slice(1)
      // Expand all ranges to 2D matrices of refs.
      .replace(/\b([a-z]+\d+):([a-z]+\d+)\b/gi, (_, from, to) =>
        JSON.stringify(expandRange(from, to)).replaceAll('"', "")
      )
      // Replace all refs by corresponding signal calls.
      .replaceAll(
        /\b([a-z]+\d+)\b/gi,
        `(this.getOrDefault('$1'.toUpperCase(), {cellId: '$1'.toUpperCase(), originalContent: "", computed: createMemo(() => 0)}).computed())`
      );

    return this.executeInExcelContext(jsFormula);
  }
}
