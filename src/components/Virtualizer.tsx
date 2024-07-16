import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import React, { FocusEvent, KeyboardEvent, useCallback, useRef } from "react";
import { colAsLabel, getCellIdFromRowCol } from "../utils";
import { createEffect, createMemo, createSignal } from "../signals";
import { Sheet } from "../models";

const sheet = new Sheet<number>();

const [focusSignal, setFocusSignal] = createSignal([1, 1]);
const [previousFocusSignal, setPreviousFocusSignal] = createSignal([1, 1]);

createEffect(() => {
  // De-select previous cell's Header row and column
  const [previousRow, previousCol] = previousFocusSignal();

  const previousHeaderColumn = document.getElementById(
    `row-0-col-${previousCol}`
  );
  const previousHeaderRow = document.getElementById(`row-${previousRow}-col-0`);
  if (previousHeaderColumn)
    previousHeaderColumn.style.backgroundColor = "white";
  if (previousHeaderRow) previousHeaderRow.style.backgroundColor = "white";

  // Select current cell's Header row and column
  const [row, col] = focusSignal();

  const headerColumn = document.getElementById(`row-0-col-${col}`);
  const headerRow = document.getElementById(`row-${row}-col-0`);
  if (headerColumn) headerColumn.style.backgroundColor = "#D3E3FD";
  if (headerRow) headerRow.style.backgroundColor = "#D3E3FD";

  // If cell is the same as previous cell, do nothing
  if (previousCol === col && previousRow === row) return;
  setPreviousFocusSignal([row, col]);
});

const Virtualizer = () => {
  const parentRef = useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: 1000,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22,
    overscan: 5,
    rangeExtractor: (range) => {
      const [, ...defaultRange] = defaultRangeExtractor(range);
      return [0, ...defaultRange];
    },
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: 50,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (i === 0 ? 45 : 101),
    overscan: 5,
    rangeExtractor: (range) => {
      const [, ...defaultRange] = defaultRangeExtractor(range);
      return [0, ...defaultRange];
    },
  });

  const focusHandler = useCallback(
    (rowIndex: number, colIndex: number) =>
      (event: FocusEvent<HTMLInputElement>) => {
        setFocusSignal([rowIndex, colIndex]);
        const cellId = getCellIdFromRowCol(rowIndex, colIndex);
        const cell = sheet.get(cellId);
        if (cell) {
          event.target.value = cell.originalContent;
        }
        event.target.select();
      },
    []
  );

  const onKeyDownHandler = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
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
        const updateFn = () => {
          const value = sheet.parseCellInput(inputContent);
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
          return;
        }

        cell.originalContent = inputContent;
        inputContent === ""
          ? cell.computed.set(() => 0)
          : cell.computed.set(updateFn);
      },
    []
  );

  const rows = rowVirtualizer.getVirtualItems();
  const cols = columnVirtualizer.getVirtualItems();

  return (
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
                    className="absolute top-0 left-0 font-normal text-right text-sm p-1 outline outline-1 outline-gray-300/60 hover:shadow-all-sides transition-shadow hover:z-10 h-[22px] w-[101px]"
                    style={{
                      transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                    }}
                    onKeyDown={onKeyDownHandler}
                    onFocus={focusHandler(
                      virtualRow.index,
                      virtualColumn.index
                    )}
                    onBlur={blurHandler(virtualRow.index, virtualColumn.index)}
                    defaultValue={sheet
                      .get(
                        getCellIdFromRowCol(
                          virtualRow.index,
                          virtualColumn.index
                        )
                      )
                      ?.computed()}
                  />
                ) : virtualRow.index === 0 && virtualColumn.index === 0 ? (
                  <div
                    className="sticky z-50 top-0 left-0 outline outline-1 outline-gray-300 bg-white p-1 w-[45px] h-[22px]"
                    onClick={() => console.log(sheet)}
                  />
                ) : virtualColumn.index === 0 ? (
                  <div
                    id={`row-${virtualRow.index}-col-0`}
                    className="mt-[-22px] sticky z-10 left-0 font-normal text-center bg-white outline outline-1 outline-gray-300 p-1 text-[11px] w-[45px] h-[22px]"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {virtualRow.index}
                  </div>
                ) : (
                  <div
                    id={`row-0-col-${virtualColumn.index}`}
                    className="mt-[-22px] sticky z-10 top-0 font-normal text-center bg-white outline outline-1 outline-gray-300 p-1 text-[11px] w-[101px] h-[22px]"
                    style={{
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
};

export default Virtualizer;
