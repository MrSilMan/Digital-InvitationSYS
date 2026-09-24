import type { CSSProperties } from 'react';

import { Icon } from '@/components/icons';
import { cn } from '@/lib/cn';

import {
  computeSerpentineLayout,
  DEFAULT_GEOMETRY,
  type SerpentineGeometry,
  type SerpentineLayout,
} from './serpentine-layout';
import styles from './serpentine-timeline.module.css';

/** Rows of 2 have wide columns: their labels get a wider inset (see the CSS), the turns less room. */
const NARROW_GEOMETRY: SerpentineGeometry = { ...DEFAULT_GEOMETRY, overhang: 0.06 };

export interface SerpentineTimelineItem {
  label: string;
  /** Already formatted, e.g. "13h00". */
  time?: string | null;
  /** Icon key (see src/components/icons). */
  icon: string;
}

interface SerpentineTimelineProps {
  items: readonly SerpentineTimelineItem[];
  className?: string;
}

function Line({ layout, className }: { layout: SerpentineLayout; className?: string }) {
  if (!layout.path) return null;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn(styles.line, className)}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="none"
    >
      <path
        d={layout.path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The day's programme as a serpentine: rows of 3 (rows of 2 when narrower than 340px), each item
 * an icon above a dot on the line, with the label and time below. The list stays in chronological
 * order for screen readers; only the visual placement snakes. The turns overhang the component's
 * box a little: give it at least 1.25rem of horizontal room.
 */
export function SerpentineTimeline({ items, className }: SerpentineTimelineProps) {
  if (items.length === 0) return null;
  const wide = computeSerpentineLayout(items.length, 3);
  const narrow = computeSerpentineLayout(items.length, 2, NARROW_GEOMETRY);

  return (
    <div
      className={cn(styles.timeline, className)}
      style={{ '--rows-wide': wide.rows, '--rows-narrow': narrow.rows } as CSSProperties}
    >
      <Line layout={wide} className={styles.lineWide} />
      <Line layout={narrow} className={styles.lineNarrow} />
      <ol className={styles.grid}>
        {items.map((item, index) => {
          const wideCell = wide.cells[index];
          const narrowCell = narrow.cells[index];
          const placement = {
            '--row-wide': (wideCell?.row ?? 0) + 1,
            '--col-wide': (wideCell?.column ?? 0) + 1,
            '--row-narrow': (narrowCell?.row ?? 0) + 1,
            '--col-narrow': (narrowCell?.column ?? 0) + 1,
          } as CSSProperties;
          return (
            <li key={`${index}-${item.label}`} className={styles.item} style={placement}>
              <Icon name={item.icon} size="100%" stroke={1.25} className={styles.icon} />
              <span aria-hidden="true" className={styles.dot} />
              <p className={styles.label}>
                <span className={styles.labelText}>{item.label}</span>
                {item.time ? (
                  <>
                    {' '}
                    <span className={styles.time}>{item.time}</span>
                  </>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
