import { createMemoType } from "./signals";

// Code gotten from Cassiano
const times = <T>(n: number, fn: (index: number) => T): T[] =>
  [...Array(n).keys()].map((i) => fn(i));

const ALPHABET_LENGTH = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;

interface CoordsInterface {
  row: number;
  col: number;
  labelCol?: string;
}

type LetterType = string;
type ColRefType = string;
type RowColType = [number, number];
export type CellId = string;
type RefOrRowColType = CellId | RowColType;

// Converts 'A' to 1, 'B' to 2... 'Z' to 26.
export const colIndexFromSingleLetter = (colSingleRef: LetterType): number => {
  return colSingleRef.charCodeAt(0) - "A".charCodeAt(0) + 1;
};

// Converts 'A' to 1, 'B' to 2... 'Z' to 26, 'AA' to 27 etc
export const colIndexFromLabel = (colRef: ColRefType): number => {
  return colRef
    .split("")
    .reduce(
      (acc, letter, i) =>
        acc +
        colIndexFromSingleLetter(letter) *
          ALPHABET_LENGTH ** (colRef.length - i - 1),
      0
    );
};

// Converts 1 to 'A', 2 to 'B'... 26 to 'Z'.
const colSingleLetter = (colIndex: number): LetterType => {
  return String.fromCharCode(colIndex - 1 + "A".charCodeAt(0));
};

// Converts 1 to 'A', 2 to 'B'... 26 to 'Z', 27 to 'AA' etc
export const colAsLabel = (
  colIndexOrLabel: number | ColRefType
): ColRefType => {
  if (typeof colIndexOrLabel === "string") return colIndexOrLabel;

  let colIndex = colIndexOrLabel - 1;
  let colRef = "";

  while (colIndex >= 0) {
    colRef = colSingleLetter((colIndex % ALPHABET_LENGTH) + 1) + colRef;

    colIndex = Math.trunc(colIndex / ALPHABET_LENGTH) - 1;
  }

  return colRef;
};

const rowColFromRef = (ref: CellId): CoordsInterface => {
  const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/i);
  const col = colIndexFromLabel(match![1]);
  const row = Number(match![2]);

  return { row, col };
};

const asCoords = (refOrCoords: RefOrRowColType): CoordsInterface => {
  let row: number, col: number;

  if (refOrCoords instanceof Array) [row, col] = refOrCoords;
  else ({ row, col } = rowColFromRef(refOrCoords));

  if (typeof col === "string") col = colIndexFromLabel(col);

  return { row, col, labelCol: colAsLabel(col) };
};

const asRef = (refOrCoords: RefOrRowColType): CellId => {
  const { row, col } = asCoords(refOrCoords);

  return colAsLabel(col) + String(row);
};

const range = (from: number, to: number) =>
  times(to - from + 1, (i) => i + from);

const expandRange = (from: CellId, to: CellId) => {
  const fromCoords = asCoords(from);
  const toCoords = asCoords(to);

  return range(fromCoords.row, toCoords.row).map((row) =>
    range(fromCoords.col, toCoords.col).map((col) => asRef([row, col]))
  );
};

type Contents = string;

export type Cell<T> = {
  cellId: CellId;
  originalContent: Contents;
  computed: createMemoType<T>;
};

export type SheetType = {
  [ref: CellId]: Cell<number>;
};

export const executeInAgregationFunctionsContext = (
  _sheet: SheetType,
  jsFormula: string
) => {
  console.log(jsFormula);
  // Agregation functions, which must be in the same context as the `eval`.
  const SUM = (refs: number[][]) =>
    refs.flat(2).reduce((acc, item) => acc + item, 0);
  const COUNT = (refs: number[][]) => refs.flat(2).length;
  const MULT = (refs: number[][]) =>
    refs.flat(2).reduce((acc, item) => acc * item, 1);
  const AVG = (refs: number[][]) => SUM(refs) / COUNT(refs);
  const MAX = (refs: number[][]) => Math.max(...refs.flat(2));
  const MIN = (refs: number[][]) => Math.min(...refs.flat(2));
  const COLS = (refs: number[][]) => (refs[0] ?? []).length;
  const ROWS = (refs: number[][]) => refs.length;

  return eval(jsFormula);
};

export const evaluateFormula = (_sheet: SheetType, formula: string) => {
  const jsFormula = formula
    .slice(1)
    // Expand all ranges to 2D matrices of refs.
    .replace(/\b([a-z]+\d+):([a-z]+\d+)\b/gi, (_, from, to) =>
      JSON.stringify(expandRange(from, to)).replaceAll('"', "")
    )
    // Replace all refs by corresponding signal calls.
    .replaceAll(/\b([a-z]+\d+)\b/gi, `(_sheet['$1'].computed())`);

  return executeInAgregationFunctionsContext(_sheet, jsFormula);
};
