import { colAsLabel, getCellIdFromRowCol } from "../utils";
import { createMemo } from "../signals";
import { Sheet } from "../models";
import { FocusEvent, KeyboardEventHandler, useCallback, useRef } from "react";
import React from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";

const sheet = new Sheet<number>();

export const DisplaySheet = () => {
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
    <div className="w-full h-full flex justify-center flex-col">
      <div className="w-full h-[143px]"></div>
      <div
        ref={parentRef}
        className="relative overflow-auto w-full flex-1 outline outline-1 outline-gray-300"
      >
        <div
          className="relative"
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
                      className="absolute top-0 left-0 font-normal text-right text-sm p-1 outline outline-1 outline-gray-300/60 hover:shadow-all-sides transition-shadow hover:z-10"
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
                      onBlur={blurHandler(
                        virtualRow.index,
                        virtualColumn.index
                      )}
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
                      className="sticky z-50 top-0 left-0 outline outline-1 outline-gray-300 bg-white p-1"
                      style={{
                        width: `${virtualColumn.size}px`,
                        height: `${virtualRow.size}px`,
                      }}
                      onClick={() => console.log(sheet)}
                    />
                  ) : virtualColumn.index === 0 ? (
                    <div
                      className="mt-[-22px] sticky z-10 left-0 font-normal text-center bg-white outline outline-1 outline-gray-300 p-1 text-xs"
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
                      className="mt-[-22px] sticky z-10 top-0 font-normal text-center bg-white outline outline-1 outline-gray-300 p-1 text-xs"
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
      <div className="h-[36px]"></div>
    </div>
  );
};
