import { BASE_CELL_SIZE, BUFFER_PIXEL_RANGE } from "@/constants/webgl";
import type { GridState, PixelRange } from "@/types";

export const convertClientPosToCanvasPos = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  clientX: number,
  clientY: number,
) => {
  const canvas = canvasRef.current;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return { x, y };
};

export const getVisibleArea = (canvas: HTMLCanvasElement, gridState: GridState) => {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const visibleWidth = canvasWidth / gridState.scale;
  const visibleHeight = canvasHeight / gridState.scale;
  const startX = Math.floor(gridState.offsetX / BASE_CELL_SIZE) * BASE_CELL_SIZE;
  const startY = Math.floor(gridState.offsetY / BASE_CELL_SIZE) * BASE_CELL_SIZE;
  const endX = startX + visibleWidth + BASE_CELL_SIZE;
  const endY = startY + visibleHeight + BASE_CELL_SIZE;

  return { startX, startY, endX, endY };
};

export const shouldFetch = (currentRange: PixelRange, lastRange: PixelRange) => {
  return (
    Math.abs(currentRange.upperLeftX - lastRange.upperLeftX) > BUFFER_PIXEL_RANGE / 4 ||
    Math.abs(currentRange.upperLeftY - lastRange.upperLeftY) > BUFFER_PIXEL_RANGE / 4 ||
    Math.abs(currentRange.lowerRightX - lastRange.lowerRightX) > BUFFER_PIXEL_RANGE / 4 ||
    Math.abs(currentRange.lowerRightY - lastRange.lowerRightY) > BUFFER_PIXEL_RANGE / 4
  );
};
