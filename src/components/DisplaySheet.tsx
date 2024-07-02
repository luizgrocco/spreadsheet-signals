import { colAsLabel, getCellIdFromRowCol } from "../utils";
import { createMemo } from "../signals";
import { Sheet } from "../models";
import {
  FocusEvent,
  KeyboardEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import React from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";

function GridVirtualizerDynamic({ sheet }: { sheet: Sheet<number> }) {
  const [, forceStateUpdate] = useState(true);
  const forceUpdate = useCallback(
    () => forceStateUpdate((state) => !state),
    []
  );

  const parentRef = useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: 1000,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    rangeExtractor: (range) => {
      const [, ...defaultRange] = defaultRangeExtractor(range);
      const pinnedRange = new Set([0, ...defaultRange]);
      return [...pinnedRange];
    },
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: 100,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (i === 0 ? 50 : 96),
    rangeExtractor: (range) => {
      const [, ...defaultRange] = defaultRangeExtractor(range);
      const pinnedRange = new Set([0, ...defaultRange]);
      return [...pinnedRange];
    },
  });

  const focusHandler = useCallback(
    (rowIndex: number, colIndex: number) =>
      (event: FocusEvent<HTMLInputElement>) => {
        const cellId = getCellIdFromRowCol(rowIndex, colIndex);
        const cell = sheet.get(cellId);
        if (cell) {
          event.target.value = cell.originalContent;
        }
        event.target.select();
      },
    []
  );

  const onKeyDownHandler: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.key === "Enter") event.currentTarget.blur();
    },
    []
  );

  const blurHandler = useCallback(
    (rowIndex: number, colIndex: number) =>
      (event: FocusEvent<HTMLInputElement>) => {
        const cellId = getCellIdFromRowCol(rowIndex, colIndex);
        const cell = sheet.get(cellId);

        const inputContent = event.target.value;
        const updateFn = event.target.value.startsWith("=")
          ? () => {
              const value = sheet.evaluateFormula(inputContent);
              event.target.value = String(value);
              return value;
            }
          : () => {
              const value = Number(inputContent);
              event.target.value = String(value);
              return value;
            };

        if (!cell) {
          if (inputContent === "") return;
          sheet.set({
            cellId,
            originalContent: inputContent,
            computed: createMemo(updateFn),
          });
        } else {
          cell.originalContent = inputContent;
          inputContent === ""
            ? cell.computed.set(() => 0)
            : cell.computed.set(updateFn);
        }

        forceUpdate();
      },
    []
  );

  const rows = rowVirtualizer.getVirtualItems();
  const cols = columnVirtualizer.getVirtualItems();

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

  return (
    <div ref={parentRef} className="relative overflow-auto">
      <div
        className="relative border border-opacity-30 border-gray-400"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
        }}
      >
        {rows.map((virtualRow) => (
          <React.Fragment key={virtualRow.key}>
            {cols.map((virtualColumn) => (
              <React.Fragment key={virtualColumn.key}>
                {virtualColumn.index !== 0 && virtualRow.index !== 0 ? (
                  <input
                    className="absolute top-0 left-0 font-normal text-right bg-white border border-opacity-20 border-gray-400 transition-shadow duration-100 ease-in-out hover:shadow-md hover:border-blue-400 focus:outline-none focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400 focus-within:ring-inset p-1 text-sm"
                    style={{
                      width: `${virtualColumn.size}px`,
                      height: `${virtualRow.size}px`,
                      transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                    }}
                    onKeyDown={onKeyDownHandler}
                    onFocus={focusHandler(
                      virtualRow.index,
                      virtualColumn.index
                    )}
                    onBlur={blurHandler(virtualRow.index, virtualColumn.index)}
                    defaultValue={
                      sheet
                        .get(
                          getCellIdFromRowCol(
                            virtualRow.index,
                            virtualColumn.index
                          )
                        )
                        ?.computed() ?? ""
                    }
                  />
                ) : virtualRow.index === 0 && virtualColumn.index === 0 ? (
                  <div
                    className="sticky z-50 top-0 left-0 font-normal text-center bg-white border border-opacity-20 border-gray-400 p-1 text-sm"
                    style={{
                      width: `${virtualColumn.size}px`,
                      height: `${virtualRow.size}px`,
                    }}
                  ></div>
                ) : virtualColumn.index === 0 ? (
                  <div
                    className="mt-[-24px] sticky z-10 left-0 font-normal text-center bg-white border border-opacity-20 border-gray-400 p-1 text-sm"
                    style={{
                      width: `${virtualColumn.size}px`,
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {virtualRow.index}
                  </div>
                ) : (
                  <div
                    className="mt-[-24px] sticky z-10 top-0 font-normal text-center bg-white border border-opacity-20 border-gray-400 p-1 text-sm"
                    style={{
                      width: `${virtualColumn.size}px`,
                      height: `${virtualRow.size}px`,
                      transform: `translateX(${virtualColumn.start}px) `,
                    }}
                  >
                    {colAsLabel(virtualColumn.index)}
                  </div>
                )}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function DisplaySheet({ sheet }: { sheet: Sheet<number> }) {
  // const blurHandler =
  //   (rowIndex: number, colIndex: number) =>
  //   (event: FocusEvent<HTMLInputElement>) => {
  //     const cellId = getCellIdFromRowCol(rowIndex, colIndex);
  //     const cell = sheet.get(cellId);

  //     const originalContents = event.target.value;
  //     const updateFn = event.target.value.startsWith("=")
  //       ? () => {
  //           const value = sheet.evaluateFormula(originalContents);
  //           event.target.value = String(value);
  //           return value;
  //         }
  //       : () => {
  //           const value = Number(originalContents);
  //           event.target.value = String(value);
  //           return value;
  //         };

  //     if (!cell) {
  //       if (originalContents === "") return;
  //       sheet.insert({
  //         cellId,
  //         originalContent: originalContents,
  //         computed: createMemo(updateFn),
  //       });
  //     } else {
  //       cell.originalContent = originalContents;
  //       originalContents === ""
  //         ? cell.computed.set(() => 0)
  //         : cell.computed.set(updateFn);
  //     }
  //   };

  return (
    <div className="w-full h-[95%] flex justify-center">
      <GridVirtualizerDynamic sheet={sheet} />
      {/* <div className="w-full h-6 flex gap-2 justify-center items-center">
        <div className="text-center w-7 text-black text-lg font-semibold" />
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <div
            className="w-36 text-black text-center text-lg font-semibold"
            key={colIndex}
          >
            {colAsLabel(colIndex + 1)}
          </div>
        ))}
      </div>
      {grid.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="w-full h-6 flex gap-2 justify-center items-center"
        >
          <div className="text-center w-7 text-black text-lg font-semibold">
            {rowIndex + 1}
          </div>
          {row.map((_, colIndex) => (
            <input
              type="text"
              key={`${colIndex}${rowIndex}`}
              className="grid-cell"
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              onFocus={focusHandler(rowIndex, colIndex)}
              onBlur={blurHandler(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))} */}
    </div>
  );
}
