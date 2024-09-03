import { hexToRgba } from "@/utils";
import { useCallback, useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { GridState, Pixel } from "../types";
import { BASE_CELL_SIZE } from "@/constants/webgl";
import { useDojo } from "./useDojo";
import { BUFFER_PIXEL_RANGE, MAX_UINT32 } from "@/constants";
import { consoleBlue, consoleGreen, consoleRed, consoleYellow } from "@/utils/console";
import { getPixelComponentFromEntities, getPixelEntities } from "@/libs/dojo/helper";

export const usePixels = (canvasRef: React.RefObject<HTMLCanvasElement | null>, gridState: GridState) => {
  const {
    setup: { toriiClient },
  } = useDojo();
  const lastFetchedRangeRef = useRef({ upperLeftX: 0, upperLeftY: 0, lowerRightX: 100, lowerRightY: 100 });
  const [visiblePixels, setVisiblePixels] = useState<Pixel[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [optimisticPixels, setOptimisticPixels] = useOptimistic(visiblePixels, (pixels, newPixel: Pixel) => {
    return [...pixels, newPixel];
  });

  const pixelLimit = useMemo(() => {
    const baseLimit = 30;
    const maxLimit = 20000;
    const scaleFactor = (2 - gridState.scale) / 1.9; // Normalized scale factor
    return Math.round(baseLimit + (maxLimit - baseLimit) * Math.pow(scaleFactor, 3));
  }, [gridState.scale]);

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

  const fetchPixels = useCallback(async () => {
    if (isFetching) {
      consoleGreen("skipping fetch: Loading...");
      return;
    }
    const currentRange = getVisiblePixelRange();
    const lastRange = lastFetchedRangeRef.current;

    const shouldFetch =
      Math.abs(currentRange.upperLeftX - lastRange.upperLeftX) > BUFFER_PIXEL_RANGE / 4 ||
      Math.abs(currentRange.upperLeftY - lastRange.upperLeftY) > BUFFER_PIXEL_RANGE / 4 ||
      Math.abs(currentRange.lowerRightX - lastRange.lowerRightX) > BUFFER_PIXEL_RANGE / 4 ||
      Math.abs(currentRange.lowerRightY - lastRange.lowerRightY) > BUFFER_PIXEL_RANGE / 4;

    if (!shouldFetch) {
      consoleGreen("skipping fetch: Not enough change");
      return;
    }

    const { upperLeftX, upperLeftY, lowerRightX, lowerRightY } = currentRange;
    // Calculate scroll direction
    const scrollDirectionX = currentRange.upperLeftX - lastRange.upperLeftX;
    const scrollDirectionY = currentRange.upperLeftY - lastRange.upperLeftY;

    // Adjust BUFFER based on scroll direction
    const dynamicBufferX = scrollDirectionX > 0 ? BUFFER_PIXEL_RANGE * 1.5 : BUFFER_PIXEL_RANGE * 0.5;
    const dynamicBufferY = scrollDirectionY > 0 ? BUFFER_PIXEL_RANGE * 1.5 : BUFFER_PIXEL_RANGE * 0.5;

    setIsFetching(true);
    try {
      const entities = await getPixelEntities(toriiClient, pixelLimit, {
        upperLeftX: Math.max(0, upperLeftX - dynamicBufferX),
        upperLeftY: Math.max(0, upperLeftY - dynamicBufferY),
        lowerRightX: Math.min(MAX_UINT32, lowerRightX + dynamicBufferX),
        lowerRightY: Math.min(MAX_UINT32, lowerRightY + dynamicBufferY),
      });

      const newPixels = getPixelComponentFromEntities(entities);

      // Update pixels in hacky way
      setVisiblePixels((prevPixels) => {
        const updatedPixels = new Map(prevPixels.map((p) => [`${p.x},${p.y}`, p]));
        newPixels.forEach((newPixel) => {
          updatedPixels.set(`${newPixel.x},${newPixel.y}`, newPixel);
        });
        return Array.from(updatedPixels.values());
      });

      consoleBlue(`update visible pixels: ${newPixels.length}`);
    } catch (error) {
      consoleRed(`Error fetching pixels: ${error}`);
    } finally {
      setIsFetching(false);
      lastFetchedRangeRef.current = currentRange;
    }
  }, [getVisiblePixelRange, pixelLimit, toriiClient, isFetching]);

  const forceFetch = useCallback(async () => {
    consoleYellow("forceFetch");
    const { upperLeftX, upperLeftY, lowerRightX, lowerRightY } = getVisiblePixelRange();
    console.log(upperLeftX, upperLeftY, lowerRightX, lowerRightY);
    const entities = await getPixelEntities(toriiClient, pixelLimit, {
      upperLeftX: upperLeftX,
      upperLeftY: upperLeftY,
      lowerRightX: lowerRightX,
      lowerRightY: lowerRightY,
    });

    const newPixels = Object.values(entities).map((entity) => ({
      x: entity["pixelaw-Pixel"].x.value as number,
      y: entity["pixelaw-Pixel"].y.value as number,
      color: hexToRgba(entity["pixelaw-Pixel"].color.value as number),
    }));

    // Update pixels in hacky way
    setVisiblePixels((prevPixels) => {
      const updatedPixels = new Map(prevPixels.map((p) => [`${p.x},${p.y}`, p]));
      newPixels.forEach((newPixel) => {
        updatedPixels.set(`${newPixel.x},${newPixel.y}`, newPixel);
      });
      return Array.from(updatedPixels.values());
    });
    console.log(newPixels.length);

    consoleBlue(`update visible pixels: ${newPixels.length}`);
  }, [pixelLimit, toriiClient, getVisiblePixelRange]);

  useEffect(() => {
    const subscription = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await toriiClient.onEntityUpdated([], (entity: any) => {
        consoleYellow(entity);
        setRefresh(true);
      });

      return sub;
    };

    const sub = subscription();
    return () => {
      sub.then((sub) => sub.cancel());
    };
  }, [toriiClient]);

  useEffect(() => {
    if (refresh) {
      forceFetch();
      setRefresh(false);
    }
  }, [forceFetch, refresh]);

  return { optimisticPixels, setOptimisticPixels, fetchPixels };
};
