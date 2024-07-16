import Window from "./Window";

export const DisplaySheet = () => {
  return (
    <div className="w-full h-full flex justify-center flex-col">
      <div className="w-full h-[143px]"></div>
      <Window />
      <div className="h-[36px]"></div>
    </div>
  );
};

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
