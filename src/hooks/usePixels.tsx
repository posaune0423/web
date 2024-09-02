import { hexToRgba } from "@/utils";
import { useCallback, useEffect, useOptimistic, useState } from "react";
import { GridState, Pixel } from "../types";
import { BASE_CELL_SIZE } from "@/constants/webgl";
import { useDojo } from "./useDojo";
import debounce from "just-debounce-it";

export const usePixels = (canvasRef: React.RefObject<HTMLCanvasElement | null>, gridState: GridState) => {
  const {
    setup: { toriiClient },
  } = useDojo();

  const [visiblePixels, setVisiblePixels] = useState<Pixel[]>([]);
  const [shouldFetch, setShouldFetch] = useState(false);
  const debouncedFetchRequest = useCallback(
    debounce(() => {
      setShouldFetch(true);
    }, 10),
    [setShouldFetch]
  );

  const [optimisticPixels, setOptimisticPixels] = useOptimistic(visiblePixels, (pixels, newPixel: Pixel) => {
    return [...pixels, newPixel];
  });

  const getVisiblePixelRange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { upperLeftX: 0, upperLeftY: 0, lowerRightX: 200, lowerRightY: 200 };

    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    const visibleWidth = canvasWidth / gridState.scale;
    const visibleHeight = canvasHeight / gridState.scale;

    const upperLeftX = Math.floor(gridState.offsetX / BASE_CELL_SIZE);
    const upperLeftY = Math.floor(gridState.offsetY / BASE_CELL_SIZE);
    const lowerRightX = Math.ceil((gridState.offsetX + visibleWidth) / BASE_CELL_SIZE);
    const lowerRightY = Math.ceil((gridState.offsetY + visibleHeight) / BASE_CELL_SIZE);

    return { upperLeftX, upperLeftY, lowerRightX, lowerRightY };
  }, [gridState, canvasRef]);

  const fetchPixels = useCallback(async () => {
    const currentRange = getVisiblePixelRange();
    const { upperLeftX, upperLeftY, lowerRightX, lowerRightY } = currentRange;

    const entities = await toriiClient.getEntities({
      limit: 50000,
      offset: 0,
      clause: {
        Composite: {
          operator: "And",
          clauses: [
            {
              Member: {
                model: "pixelaw-Pixel",
                member: "x",
                operator: "Gte",
                value: { U32: upperLeftX },
              },
            },
            {
              Member: {
                model: "pixelaw-Pixel",
                member: "x",
                operator: "Lte",
                value: { U32: lowerRightX },
              },
            },
            {
              Member: {
                model: "pixelaw-Pixel",
                member: "y",
                operator: "Gte",
                value: { U32: upperLeftY },
              },
            },
            {
              Member: {
                model: "pixelaw-Pixel",
                member: "y",
                operator: "Lte",
                value: { U32: lowerRightY },
              },
            },
          ],
        },
      },
    });

    const pixels = Object.values(entities).map((entity) => {
      return {
        x: entity["pixelaw-Pixel"].x.value as number,
        y: entity["pixelaw-Pixel"].y.value as number,
        color: hexToRgba(entity["pixelaw-Pixel"].color.value as number),
      };
    });
    console.log(pixels);
    setVisiblePixels(pixels);

    setShouldFetch(false);
  }, [toriiClient, getVisiblePixelRange]);

  useEffect(() => {
    if (shouldFetch) {
      fetchPixels();
    }
  }, [fetchPixels, shouldFetch]);

  return { optimisticPixels, setOptimisticPixels, debouncedFetchRequest, setShouldFetch };
};
