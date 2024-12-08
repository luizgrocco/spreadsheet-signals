import {
  CellId,
  CellOrRowColType,
  ColId,
  CoordsInterface,
  Letter,
} from "./models";

function times<T>(n: number, fn: (index: number) => T): T[] {
  return [...Array(n).keys()].map((i) => fn(i));
}

const ALPHABET_LENGTH = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;

// Converts 'A' to 1, 'B' to 2... 'Z' to 26.
function colIndexFromSingleLetter(colSingleRef: Letter): number {
  return colSingleRef.charCodeAt(0) - "A".charCodeAt(0) + 1;
}

// Converts 1 to 'A', 2 to 'B'... 26 to 'Z'.
function colSingleLetter(colIndex: number): Letter {
  return String.fromCharCode(colIndex - 1 + "A".charCodeAt(0));
}

// Converts 'A' to 1, 'B' to 2... 'Z' to 26, 'AA' to 27 etc
export function colIndexFromLabel(colRef: ColId): number {
  return colRef
    .split("")
    .reduce(
      (acc, letter, i) =>
        acc +
        colIndexFromSingleLetter(letter) *
          ALPHABET_LENGTH ** (colRef.length - i - 1),
      0
    );
}

// Converts 1 to 'A', 2 to 'B'... 26 to 'Z', 27 to 'AA' etc
export function colAsLabel(colIndexOrLabel: number | ColId): ColId {
  if (typeof colIndexOrLabel === "string") return colIndexOrLabel;

  let colIndex = colIndexOrLabel - 1;
  let colRef = "";

  while (colIndex >= 0) {
    colRef = colSingleLetter((colIndex % ALPHABET_LENGTH) + 1) + colRef;

    colIndex = Math.trunc(colIndex / ALPHABET_LENGTH) - 1;
  }

  return colRef;
}

export function rowColFromCellId(cellId: CellId): CoordsInterface {
  const match = cellId.toUpperCase().match(/^([A-Z]+)(\d+)$/i);
  const col = colIndexFromLabel(match![1]);
  const row = Number(match![2]);

  return { row, col };
}

function asCoords(cellIdOrCoords: CellOrRowColType): CoordsInterface {
  let row: number, col: number;

  if (cellIdOrCoords instanceof Array) [row, col] = cellIdOrCoords;
  else ({ row, col } = rowColFromCellId(cellIdOrCoords));

  if (typeof col === "string") col = colIndexFromLabel(col);

  return { row, col, labelCol: colAsLabel(col) };
}

function asColId(cellIfOrCoords: CellOrRowColType): CellId {
  const { row, col } = asCoords(cellIfOrCoords);

  return colAsLabel(col) + String(row);
}

function range(from: number, to: number) {
  return times(to - from + 1, (i) => i + from);
}

export function expandRange(from: CellId, to: CellId): CellId[] {
  const fromCoords = asCoords(from);
  const toCoords = asCoords(to);

  return range(fromCoords.row, toCoords.row)
    .map((row) =>
      range(fromCoords.col, toCoords.col).map((col) => asColId([row, col]))
    )
    .flat();
}

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

// const entireRange = (() => {
//   const range: string[] = [];
//   for (const row of rows) {
//     for (const col of cols) {
//       if (row.index !== 0 && col.index !== 0)
//         range.push(getCellIdFromRowCol(row.index, col.index));
//     }
//   }
//   return range;
// })();

// const range = (() => {
//   if (rows.length === 0 || cols.length === 0) return ["", ""];

//   const [, firstRow] = rows;
//   const lastRow = rows[rows.length - 1];
//   const [, firstCol] = cols;
//   const lastCol = cols[cols.length - 1];
//   return [
//     getCellIdFromRowCol(firstRow.index, firstCol.index),
//     getCellIdFromRowCol(lastRow.index, lastCol.index),
//   ];
// })();
