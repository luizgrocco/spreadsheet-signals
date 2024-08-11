import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import React, {
  FC,
  FocusEvent,
  KeyboardEvent,
  useCallback,
  useRef,
} from "react";
import { colAsLabel, getCellIdFromRowCol } from "../utils";
import { createMemo } from "../signals";
import { Sheet } from "../models";

type GridProps = {
  sheet: Sheet<number>;
  focusedCell: [number, number];
  setFocusedCell: (cell: [number, number]) => void;
};

export const Grid: FC<GridProps> = ({ sheet, focusedCell, setFocusedCell }) => {
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
    count: 100,
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
        setFocusedCell([rowIndex, colIndex]);
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

  const [focusedCellRow, focusedCellCol] = focusedCell;

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
                      ...(focusedCellCol === virtualColumn.index &&
                      focusedCellRow === virtualRow.index
                        ? { border: "2px solid #1A73E8", zIndex: 5 }
                        : {}),
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
                    className="sticky z-50 top-0 left-0 outline outline-1 outline-gray-300 bg-[#F8F9FA] p-1 w-[45px] h-[22px]"
                    onClick={() => console.log(sheet)}
                  />
                ) : virtualColumn.index === 0 ? (
                  <div
                    id={`row-${virtualRow.index}-col-0`}
                    className="mt-[-22px] sticky z-10 left-0 font-normal text-center bg-white outline outline-1 outline-gray-300 p-1 text-[11px] w-[45px] h-[22px]"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      ...(focusedCellRow === virtualRow.index
                        ? {
                            backgroundColor: "#D3E3FD",
                          }
                        : {}),
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
                      ...(focusedCellCol === virtualColumn.index
                        ? {
                            backgroundColor: "#D3E3FD",
                          }
                        : {}),
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
