// Code gotten from Cassiano
const ALPHABET_LENGTH = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;

interface CoordsInterface {
  row: number;
  col: number;
  labelCol?: string;
}

type LetterType = string;
type ColRefType = string;
type RowColType = [number, number];
type RefType = string;
type RefOrRowColType = RefType | RowColType;
type CellValueType = string | number | undefined;

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
