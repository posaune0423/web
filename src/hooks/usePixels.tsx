import { hexToRgba } from "@/utils";
import { useCallback, useEffect, useOptimistic, useRef, useState } from "react";
import { GridState, Pixel } from "../types";
import { BASE_CELL_SIZE } from "@/components/PixelViewer/const";
import { useDojo } from "./useDojo";

export const usePixels = (canvasRef: React.RefObject<HTMLCanvasElement | null>, gridState: GridState) => {
  const {
    setup: { toriiClient },
  } = useDojo();

  const [visiblePixels, setVisiblePixels] = useState<Pixel[]>([]);
  const lastFetchedRange = useRef({ upperLeftX: 0, upperLeftY: 0, lowerRightX: 0, lowerRightY: 0 });
  const fetchThreshold = 0.2; // 20%の変化で再フェッチ

  const getVisiblePixelRange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { upperLeftX: 0, upperLeftY: 0, lowerRightX: 0, lowerRightY: 0 };

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const visibleWidth = canvasWidth / gridState.scale;
    const visibleHeight = canvasHeight / gridState.scale;

    const upperLeftX = Math.floor(gridState.offsetX / BASE_CELL_SIZE);
    const upperLeftY = Math.floor(gridState.offsetY / BASE_CELL_SIZE);
    const lowerRightX = Math.ceil((gridState.offsetX + visibleWidth) / BASE_CELL_SIZE);
    const lowerRightY = Math.ceil((gridState.offsetY + visibleHeight) / BASE_CELL_SIZE);

    return { upperLeftX, upperLeftY, lowerRightX, lowerRightY };
  }, [gridState, canvasRef]);

  useEffect(() => {
    const fetchPixels = async () => {
      const currentRange = getVisiblePixelRange();
      const { upperLeftX, upperLeftY, lowerRightX, lowerRightY } = currentRange;
      const lastRange = lastFetchedRange.current;

      const shouldFetch =
        Math.abs(upperLeftX - lastRange.upperLeftX) > (lowerRightX - upperLeftX) * fetchThreshold ||
        Math.abs(upperLeftY - lastRange.upperLeftY) > (lowerRightY - upperLeftY) * fetchThreshold ||
        Math.abs(lowerRightX - lastRange.lowerRightX) > (lowerRightX - upperLeftX) * fetchThreshold ||
        Math.abs(lowerRightY - lastRange.lowerRightY) > (lowerRightY - upperLeftY) * fetchThreshold;
      if (!shouldFetch) return;

      const data = await toriiClient.getEntities({
        limit: 50000,
        offset: 0,
        clause: {
          Composite: {
            operator: "And",
            clauses: [
              { Member: { model: "pixelaw-Pixel", member: "x", operator: "Gte", value: { U32: upperLeftX } } },
              { Member: { model: "pixelaw-Pixel", member: "x", operator: "Lte", value: { U32: lowerRightX } } },
              { Member: { model: "pixelaw-Pixel", member: "y", operator: "Gte", value: { U32: upperLeftY } } },
              { Member: { model: "pixelaw-Pixel", member: "y", operator: "Lte", value: { U32: lowerRightY } } },
            ],
          },
        },
      });

      const pixels = Object.values(data).map((entity) => {
        return {
          x: entity["pixelaw-Pixel"].x.value as number,
          y: entity["pixelaw-Pixel"].y.value as number,
          color: hexToRgba(entity["pixelaw-Pixel"].color.value as number),
        };
      });
      setVisiblePixels(pixels);
      // Update lastFetchedRange
      lastFetchedRange.current = currentRange;
    };

    fetchPixels();
  }, [toriiClient, getVisiblePixelRange]);

  const [optimisticPixels, setOptimisticPixels] = useOptimistic(visiblePixels, (pixels, newPixel: Pixel) => {
    return [...pixels, newPixel];
  });

  return { optimisticPixels, setOptimisticPixels };
};
