/**
 * Layout maths for the serpentine timeline: items fill rows left→right, then right→left, then
 * left→right…; the line runs through every dot, turning at the end of each row with a half-ellipse
 * down to the first dot of the next row (on the right after a left→right row, on the left after a
 * right→left row). Works for any number of items and columns.
 *
 * Coordinates are in "viewBox units": every cell is `cellWidth` wide and `rowHeight` tall, and the
 * dot sits `dotY` units below the top of its row. The component scales them to the real size.
 * The turns bulge past the outer columns, like the reference design: that keeps them clear of the
 * labels under the outer dots.
 */

export interface SerpentineGeometry {
  cellWidth: number;
  rowHeight: number;
  dotY: number;
  /** How far a turn reaches past the outer columns' edge, as a share of a column. */
  overhang: number;
}

export const DEFAULT_GEOMETRY: SerpentineGeometry = {
  cellWidth: 100,
  rowHeight: 100,
  dotY: 43,
  overhang: 0.12,
};

export interface SerpentineCell {
  /** Position of the item in chronological order. */
  index: number;
  /** 0-based visual row. */
  row: number;
  /** 0-based visual column (right→left rows are mirrored). */
  column: number;
}

export interface SerpentineLayout {
  columns: number;
  rows: number;
  cells: SerpentineCell[];
  /** SVG path through every dot; empty when there are fewer than two items. */
  path: string;
  /** Size of the viewBox that `path` uses. */
  width: number;
  height: number;
}

export function serpentineCell(index: number, columns: number): SerpentineCell {
  const row = Math.floor(index / columns);
  const offset = index % columns;
  return { index, row, column: row % 2 === 0 ? offset : columns - 1 - offset };
}

const round = (value: number) => Math.round(value * 100) / 100;

export function computeSerpentineLayout(
  count: number,
  columns: number,
  geometry: SerpentineGeometry = DEFAULT_GEOMETRY,
): SerpentineLayout {
  if (!Number.isInteger(columns) || columns < 1) {
    throw new RangeError(`columns must be a positive integer, got ${columns}`);
  }
  const total = Math.max(0, Math.floor(count));
  const rows = Math.ceil(total / columns);
  const cells = Array.from({ length: total }, (_, index) => serpentineCell(index, columns));
  const { cellWidth, rowHeight, dotY, overhang } = geometry;
  const x = (column: number) => round((column + 0.5) * cellWidth);
  const y = (row: number) => round(row * rowHeight + dotY);
  const radiusX = round(cellWidth * (0.5 + overhang));
  const radiusY = round(rowHeight / 2);

  let path = '';
  const [first] = cells;
  if (first && total >= 2) {
    path = `M${x(first.column)} ${y(first.row)}`;
    for (let index = 1; index < total; index += 1) {
      const previous = cells[index - 1];
      const cell = cells[index];
      if (!previous || !cell) continue;
      if (cell.row === previous.row) {
        path += ` H${x(cell.column)}`;
      } else {
        // Clockwise (sweep 1) bulges right after a left→right row; anticlockwise bulges left.
        const sweep = previous.row % 2 === 0 ? 1 : 0;
        path += ` A${radiusX} ${radiusY} 0 0 ${sweep} ${x(cell.column)} ${y(cell.row)}`;
      }
    }
  }

  return { columns, rows, cells, path, width: columns * cellWidth, height: rows * rowHeight };
}
