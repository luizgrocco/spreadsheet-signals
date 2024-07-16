import { createMemo as createComputed, createMemoType } from "../signals";
import { compareCellIds, expandRange } from "../utils";

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
  cells: Map<CellId, Cell<T>>;

  constructor(cells: Cell<T>[] = []) {
    this.cells = new Map(cells.map((cell) => [cell.cellId, cell]));
  }

  set(cell: Cell<T>): Cell<T> {
    this.cells.set(cell.cellId, cell);
    return cell;
  }

  get(id: CellId): Cell<T> | undefined {
    return this.cells.get(id);
  }

  getOrDefault(id: CellId, defaultCell: Cell<T>): Cell<T> {
    return this.get(id) || this.set(defaultCell);
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
    // @ts-expect-error
    const SUM = this.SUM;
    // @ts-expect-error
    const COUNT = this.COUNT;
    // @ts-expect-error
    const MULT = this.MULT;
    // @ts-expect-error
    const AVG = this.AVG;
    // @ts-expect-error
    const MAX = this.MAX;
    // @ts-expect-error
    const MIN = this.MIN;
    // @ts-expect-error
    const COLS = this.COLS;
    // @ts-expect-error
    const ROWS = this.ROWS;

    // @ts-expect-error
    const createMemo = createComputed;

    return eval(jsFormula);
  };

  parseCellInput(input: string): number {
    const isFormula = input.startsWith("=");

    if (!isFormula) return Number(input);

    const jsFormula = input
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

// @ts-expect-error
class SortedArray<Item, Key extends string = string> {
  items: [Key, Item][];
  comparisonFn: (a: Key, b: Key) => number;

  constructor(
    items: [Key, Item][] = [],
    comparisonFn: (a: Key, b: Key) => number = (a, b) => a.localeCompare(b)
  ) {
    this.comparisonFn = comparisonFn;
    this.items = items.sort(([a], [b]) => comparisonFn(a, b));
  }

  get(key: Key): Item | undefined {
    let low = 0;
    let high = this.items.length - 1;
    let mid;
    let middleElKey: Key, middleElItem: Item;
    while (low <= high) {
      mid = Math.floor((low + high) / 2);
      [middleElKey, middleElItem] = this.items[mid];

      if (this.comparisonFn(key, middleElKey) === 0) {
        return middleElItem;
      } else if (this.comparisonFn(key, middleElKey) <= -1) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return undefined;
  }

  set(key: Key, item: Item): Item {
    let i = this.items.length - 1;
    for (; i >= 0 && compareCellIds(this.items[i][0], key) === 1; i--) {
      this.items[i + 1] = this.items[i];
    }

    this.items[i + 1] = [key, item];
    return item;
  }
}
