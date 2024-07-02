import {
  CellId,
  CellOrRowColType,
  ColId,
  CoordsInterface,
  Letter,
} from "./models";

const times = <T>(n: number, fn: (index: number) => T): T[] =>
  [...Array(n).keys()].map((i) => fn(i));

const ALPHABET_LENGTH = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;

// Converts 'A' to 1, 'B' to 2... 'Z' to 26.
export const colIndexFromSingleLetter = (colSingleRef: Letter): number => {
  return colSingleRef.charCodeAt(0) - "A".charCodeAt(0) + 1;
};

// Converts 'A' to 1, 'B' to 2... 'Z' to 26, 'AA' to 27 etc
export const colIndexFromLabel = (colRef: ColId): number => {
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
const colSingleLetter = (colIndex: number): Letter => {
  return String.fromCharCode(colIndex - 1 + "A".charCodeAt(0));
};

// Converts 1 to 'A', 2 to 'B'... 26 to 'Z', 27 to 'AA' etc
export const colAsLabel = (colIndexOrLabel: number | ColId): ColId => {
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

const asCoords = (refOrCoords: CellOrRowColType): CoordsInterface => {
  let row: number, col: number;

  if (refOrCoords instanceof Array) [row, col] = refOrCoords;
  else ({ row, col } = rowColFromRef(refOrCoords));

  if (typeof col === "string") col = colIndexFromLabel(col);

  return { row, col, labelCol: colAsLabel(col) };
};

const asRef = (refOrCoords: CellOrRowColType): CellId => {
  const { row, col } = asCoords(refOrCoords);

  return colAsLabel(col) + String(row);
};

const range = (from: number, to: number) =>
  times(to - from + 1, (i) => i + from);

export const expandRange = (from: CellId, to: CellId) => {
  const fromCoords = asCoords(from);
  const toCoords = asCoords(to);

  return range(fromCoords.row, toCoords.row).map((row) =>
    range(fromCoords.col, toCoords.col).map((col) => asRef([row, col]))
  );
};

export function compareCellIds(idA: CellId, idB: CellId) {
  const aRowNo = idA.match(/\d+$/);
  const bRowNo = idB.match(/\d+$/);

  if (!aRowNo) throw new Error(`${idA} is not a valid cell id`);
  if (!bRowNo) throw new Error(`${idB} is not a valid cell id`);

  if (aRowNo[0] > bRowNo[0]) {
    return 1;
  } else if (aRowNo[0] < bRowNo[0]) {
    return -1;
  } else {
    const [aColumnLetters] = idA.match(/^[A-Z]+/) ?? [];
    const [bColumnLetters] = idB.match(/^[A-Z]+/) ?? [];

    if (!aColumnLetters) throw new Error(`${idA} is not a valid cell id`);
    if (!bColumnLetters) throw new Error(`${idB} is not a valid cell id`);

    const a = colIndexFromLabel(aColumnLetters);
    const b = colIndexFromLabel(bColumnLetters);

    return a - b;
  }
}

export const getCellIdFromRowCol = (row: number, col: number) =>
  (colAsLabel(col) + String(row)).toUpperCase();
