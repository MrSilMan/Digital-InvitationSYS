import { describe, expect, it } from 'vitest';

import {
  computeSerpentineLayout,
  DEFAULT_GEOMETRY,
  serpentineCell,
} from '@/components/ui/serpentine-layout';

describe('serpentine timeline layout', () => {
  it('snakes left→right, right→left, left→right… (7 items in rows of 3)', () => {
    const { cells, rows } = computeSerpentineLayout(7, 3);
    expect(rows).toBe(3);
    expect(cells.map(({ row, column }) => [row, column])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 1],
      [1, 0],
      [2, 0],
    ]);
  });

  it('draws straight segments along each row and alternating half-ellipses between rows', () => {
    // Dots at x = 50/150/250, y = 43/143/243 (default geometry).
    expect(computeSerpentineLayout(7, 3).path).toBe(
      'M50 43 H150 H250 A62 50 0 0 1 250 143 H150 H50 A62 50 0 0 0 50 243',
    );
  });

  it('turns right after a left→right row and left after a right→left row', () => {
    const { path } = computeSerpentineLayout(8, 2);
    const arcs = path.match(/A[^A-Z]+/g) ?? [];
    expect(arcs).toHaveLength(3);
    expect(arcs.map((arc) => arc.split(' ')[4])).toEqual(['1', '0', '1']);
  });

  it.each([
    [3, 0.12],
    [2, 0.06],
  ])(
    'in rows of %i, turns overhang the outer columns by exactly %f of a column',
    (columns, share) => {
      const geometry = { ...DEFAULT_GEOMETRY, overhang: share };
      const { path, width } = computeSerpentineLayout(12, columns, geometry);
      const arcs = path.match(/A[^A-Z]+/g) ?? [];
      expect(arcs.length).toBeGreaterThan(0);
      for (const arc of arcs) {
        const [radiusX = 0, , , , sweep, endX = 0] = arc.slice(1).trim().split(' ').map(Number);
        const outerEdge = sweep === 1 ? endX + radiusX : endX - radiusX;
        const overhang = share * geometry.cellWidth;
        expect(outerEdge).toBeCloseTo(sweep === 1 ? width + overhang : -overhang);
      }
    },
  );

  it.each([
    [1, 3, 1, ''],
    [2, 3, 1, 'M50 43 H150'],
    [3, 3, 1, 'M50 43 H150 H250'],
    [4, 3, 2, 'M50 43 H150 H250 A62 50 0 0 1 250 143'],
    [3, 2, 2, 'M50 43 H150 A62 50 0 0 1 150 143'],
    [4, 2, 2, 'M50 43 H150 A62 50 0 0 1 150 143 H50'],
  ])('%i items in %i columns → %i row(s)', (count, columns, rows, path) => {
    const layout = computeSerpentineLayout(count, columns);
    expect(layout.rows).toBe(rows);
    expect(layout.path).toBe(path);
    expect(layout.width).toBe(columns * 100);
    expect(layout.height).toBe(rows * 100);
  });

  it('places every item exactly once, within the grid, for any count', () => {
    for (const columns of [2, 3]) {
      for (let count = 0; count <= 12; count += 1) {
        const { cells, rows } = computeSerpentineLayout(count, columns);
        expect(cells).toHaveLength(count);
        const slots = new Set(cells.map(({ row, column }) => `${row}:${column}`));
        expect(slots.size).toBe(count);
        for (const { row, column } of cells) {
          expect(row).toBeLessThan(rows);
          expect(column).toBeGreaterThanOrEqual(0);
          expect(column).toBeLessThan(columns);
        }
      }
    }
  });

  it('rejects impossible column counts', () => {
    expect(() => computeSerpentineLayout(3, 0)).toThrow(RangeError);
    expect(() => computeSerpentineLayout(3, 1.5)).toThrow(RangeError);
    expect(serpentineCell(5, 3)).toEqual({ index: 5, row: 1, column: 0 });
  });
});
