import { FC, useCallback, useRef } from "react";
import {
  FixedSizeList as Header,
  FixedSizeGrid as Grid,
  GridOnScrollProps,
  GridChildComponentProps,
  ListChildComponentProps,
} from "react-window";
import { colAsLabel } from "../utils";
import AutoSizer from "react-virtualized-auto-sizer";

const InputCell: FC<GridChildComponentProps> = ({ style }) => (
  <input
    className="font-normal text-right text-sm p-1 outline outline-1 outline-gray-300/60 hover:shadow-all-sides transition-shadow hover:z-10"
    style={style}
  />
);

const RowHeaderCell: FC<ListChildComponentProps> = ({
  index: rowIndex,
  style,
}) => (
  <div
    className="font-normal text-center bg-white outline outline-1 outline-gray-300 p-1 text-[11px]"
    style={style}
  >
    {rowIndex}
  </div>
);

const ColumnHeaderCell: FC<ListChildComponentProps> = ({
  index: columnIndex,
  style,
}) => (
  <div
    className="font-normal text-center bg-white outline outline-1 outline-gray-300 p-1 text-[11px]"
    style={style}
  >
    {colAsLabel(columnIndex + 1)}
  </div>
);

const Window = () => {
  const staticColumnHeaders = useRef<Header>(null);
  const staticRowHeaders = useRef<Header>(null);

  const onScroll = useCallback(
    ({
      scrollTop,
      scrollLeft,
      scrollUpdateWasRequested,
    }: GridOnScrollProps) => {
      if (!scrollUpdateWasRequested) {
        if (staticColumnHeaders.current) {
          staticColumnHeaders.current.scrollTo(scrollTop);
        }

        if (staticRowHeaders.current) {
          staticRowHeaders.current.scrollTo(scrollLeft);
        }
      }
    },
    []
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex">
        <div className="outline outline-1 outline-gray-300 bg-white p-1 w-[45px] h-[22px]" />
        <AutoSizer>
          {({ width }) => (
            <Header
              ref={staticRowHeaders}
              style={{ overflowX: "hidden" }}
              itemCount={100}
              itemSize={101}
              direction="horizontal"
              height={22}
              width={width - 45}
              className="outline outline-1 outline-gray-300"
            >
              {ColumnHeaderCell}
            </Header>
          )}
        </AutoSizer>
      </div>
      <div className="h-full">
        <AutoSizer>
          {({ height }) => (
            <Header
              ref={staticColumnHeaders}
              direction="vertical"
              style={{ overflowY: "hidden" }}
              itemSize={22}
              itemCount={1000}
              height={height}
              width={45}
              className="outline outline-1 outline-gray-300"
            >
              {RowHeaderCell}
            </Header>
          )}
        </AutoSizer>
        <AutoSizer>
          {({ height, width }) => (
            <Grid
              onScroll={onScroll}
              columnCount={100}
              columnWidth={101}
              height={height}
              rowCount={1000}
              rowHeight={22}
              width={width - 45}
              className="outline outline-1 outline-gray-300 left-[45px]"
            >
              {InputCell}
            </Grid>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default Window;
