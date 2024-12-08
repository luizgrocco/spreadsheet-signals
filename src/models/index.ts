import { CreateMemoType } from "../signals";

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

// Make Sheet agnostic to cell contents, it should only need to be an object with a cellId of type CellId
export type Cell<T> = {
  cellId: CellId;
  originalContent: Contents;
  computed: CreateMemoType<T>;
};

export class Sheet<T extends number> {
  cells: Map<CellId, Cell<T>>;
  defaultCell: Omit<Cell<T>, "cellId">;

  constructor(defaultCell: Omit<Cell<T>, "cellId">, cells: Cell<T>[] = []) {
    this.cells = new Map(cells.map((cell) => [cell.cellId, cell]));
    this.defaultCell = defaultCell;
  }

  set(cell: Cell<T>): Cell<T> {
    this.cells.set(cell.cellId, cell);
    return cell;
  }

  get(id: CellId): Cell<T> | undefined {
    return this.cells.get(id);
  }

  getOrDefault(id: CellId): Cell<T> {
    return this.get(id) || this.set({ cellId: id, ...this.defaultCell });
  }
}
