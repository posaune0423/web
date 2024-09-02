import { type Color, type GridDimensions } from "@/types";

export const DEFAULT_BACKGROUND_COLOR: Color = { r: 0.01, g: 0.01, b: 0.01, a: 0.8 };
export const DEFAULT_GRID_COLOR: Color = { r: 0.8, g: 0.8, b: 0.8, a: 0.8 };
export const MAX_SCALE = 2;
export const MIN_SCALE = 0.1;
export const BASE_CELL_SIZE = 50;
export const DEFAULT_GRID_DIMENSIONS: GridDimensions = { width: 2000, height: 2000 };
export const SWIPE_THRESHOLD = 10; // pixels
export const BUFFER_RATIO = 1.5;
export const BASE_LINE_WIDTH = 1.0;

export const COLOR_PALETTE: Color[] = [
  { r: 1, g: 0, b: 0, a: 1 },
  { r: 0, g: 1, b: 0, a: 1 },
  { r: 0, g: 0, b: 1, a: 1 },
  { r: 1, g: 1, b: 0, a: 1 },
  { r: 1, g: 0, b: 1, a: 1 },
  { r: 0, g: 1, b: 1, a: 1 },
];
