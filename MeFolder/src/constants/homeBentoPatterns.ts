export type BentoSpan = 1 | 2;

export interface BentoPatternSlot {
  index: number;
  column: number;
  row: number;
  colSpan: BentoSpan;
  rowSpan: BentoSpan;
}

export interface BentoPattern {
  id: string;
  slots: BentoPatternSlot[];
}

export interface BentoLayoutConfig {
  columns: number;
  rows: number;
  maxAlbums: number;
  maxGridHeight: number;
  preferredRowHeightRatio: number;
  patterns: BentoPattern[];
}

const MOBILE_PATTERNS: BentoPattern[] = [
  {
    id: "mobile-top-balance",
    slots: [
      { index: 0, column: 0, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 2, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 0, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 3, column: 1, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 4, column: 2, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 3, row: 2, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "mobile-diagonal-left",
    slots: [
      { index: 0, column: 0, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 2, row: 1, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 2, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 3, column: 3, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 4, column: 0, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 1, row: 2, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "mobile-diagonal-right",
    slots: [
      { index: 0, column: 2, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 0, row: 1, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 0, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 3, column: 1, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 4, column: 2, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 3, row: 2, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "mobile-bottom-balance",
    slots: [
      { index: 0, column: 0, row: 1, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 2, row: 1, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 0, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 3, column: 1, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 4, column: 2, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 3, row: 0, colSpan: 1, rowSpan: 1 },
    ],
  },
];

const TABLET_PATTERNS: BentoPattern[] = [
  {
    id: "tablet-top-crown",
    slots: [
      { index: 0, column: 0, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 2, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 0, row: 2, colSpan: 1, rowSpan: 2 },
      { index: 3, column: 3, row: 2, colSpan: 1, rowSpan: 2 },
      { index: 4, column: 1, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 2, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 6, column: 1, row: 3, colSpan: 1, rowSpan: 1 },
      { index: 7, column: 2, row: 3, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "tablet-bottom-crown",
    slots: [
      { index: 0, column: 0, row: 2, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 2, row: 2, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 0, row: 0, colSpan: 1, rowSpan: 2 },
      { index: 3, column: 3, row: 0, colSpan: 1, rowSpan: 2 },
      { index: 4, column: 1, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 2, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 6, column: 1, row: 1, colSpan: 1, rowSpan: 1 },
      { index: 7, column: 2, row: 1, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "tablet-diagonal-left",
    slots: [
      { index: 0, column: 0, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 2, row: 2, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 2, row: 0, colSpan: 2, rowSpan: 1 },
      { index: 3, column: 0, row: 3, colSpan: 2, rowSpan: 1 },
      { index: 4, column: 2, row: 1, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 3, row: 1, colSpan: 1, rowSpan: 1 },
      { index: 6, column: 0, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 7, column: 1, row: 2, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "tablet-diagonal-right",
    slots: [
      { index: 0, column: 2, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 0, row: 2, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 0, row: 0, colSpan: 2, rowSpan: 1 },
      { index: 3, column: 2, row: 3, colSpan: 2, rowSpan: 1 },
      { index: 4, column: 0, row: 1, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 1, row: 1, colSpan: 1, rowSpan: 1 },
      { index: 6, column: 2, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 7, column: 3, row: 2, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "tablet-three-focus-left",
    slots: [
      { index: 0, column: 0, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 2, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 0, row: 2, colSpan: 2, rowSpan: 2 },
      { index: 3, column: 2, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 4, column: 3, row: 2, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 2, row: 3, colSpan: 1, rowSpan: 1 },
      { index: 6, column: 3, row: 3, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "tablet-three-focus-right",
    slots: [
      { index: 0, column: 0, row: 0, colSpan: 2, rowSpan: 2 },
      { index: 1, column: 0, row: 2, colSpan: 2, rowSpan: 2 },
      { index: 2, column: 2, row: 1, colSpan: 2, rowSpan: 2 },
      { index: 3, column: 2, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 4, column: 3, row: 0, colSpan: 1, rowSpan: 1 },
      { index: 5, column: 2, row: 3, colSpan: 1, rowSpan: 1 },
      { index: 6, column: 3, row: 3, colSpan: 1, rowSpan: 1 },
    ],
  },
];

export const HOME_BENTO_LAYOUTS = {
  mobile: {
    columns: 4,
    rows: 3,
    maxAlbums: 6,
    maxGridHeight: 360,
    preferredRowHeightRatio: 1.12,
    patterns: MOBILE_PATTERNS,
  } satisfies BentoLayoutConfig,
  tablet: {
    columns: 4,
    rows: 4,
    maxAlbums: 8,
    maxGridHeight: 468,
    preferredRowHeightRatio: 0.72,
    patterns: TABLET_PATTERNS,
  } satisfies BentoLayoutConfig,
} as const;

export const getHomeBentoLayoutConfig = (
  isTablet: boolean,
): BentoLayoutConfig =>
  isTablet ? HOME_BENTO_LAYOUTS.tablet : HOME_BENTO_LAYOUTS.mobile;
