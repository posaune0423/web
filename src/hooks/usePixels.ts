import { useCallback, useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { GridState, Pixel } from "../types";
import { BASE_CELL_SIZE } from "@/constants/webgl";
import { useDojo } from "./useDojo";
import { getPixelComponentFromEntities, getPixelComponentValue, getPixelEntities } from "@/libs/dojo/helper";
import { Entity } from "@dojoengine/torii-client";

const BUFFER_PIXEL_RANGE = 30;
const MAX_UINT32 = 4294967295;
const THROTTLE_MS = 200; // throttleの間隔

export const usePixels = (canvasRef: React.RefObject<HTMLCanvasElement | null>, gridState: GridState) => {
  const {
    setup: { toriiClient },
  } = useDojo();

  // Ref
  const lastFetchedRangeRef = useRef({ upperLeftX: 0, upperLeftY: 0, lowerRightX: 100, lowerRightY: 100 });
  const lastFetchTimeRef = useRef(0);

  // State
  const [visiblePixels, setVisiblePixels] = useState<Pixel[]>([]);
  const [isFetching, setIsFetching] = useState(false);
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
    } catch (error) {
      console.error("Error fetching pixels:", error);
    } finally {
      setIsFetching(false);
      lastFetchedRangeRef.current = currentRange;
    }
  }, [getVisiblePixelRange, pixelLimit, toriiClient, isFetching]);

  const throttledFetchPixels = useCallback(() => {
    const now = performance.now();
    if (now - lastFetchTimeRef.current >= THROTTLE_MS) {
      lastFetchTimeRef.current = now;
      fetchPixels();
    }
  }, [fetchPixels]);

  useEffect(() => {
    const subscription = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await toriiClient.onEntityUpdated([], (_entityId: any, entity: Entity) => {
        const pixel = getPixelComponentValue(entity);
        setVisiblePixels((prev) => [...prev, pixel]);
      });

      return sub;
    };

    const sub = subscription();
    return () => {
      sub.then((sub) => sub.cancel());
    };
  }, [toriiClient, setVisiblePixels]);

  // initial fetch
  useEffect(() => {
    fetchPixels();
  }, []);

  return { optimisticPixels, setOptimisticPixels, fetchPixels, throttledFetchPixels };
};
