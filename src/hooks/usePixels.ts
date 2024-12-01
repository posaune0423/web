import { useCallback, useEffect, useOptimistic, useRef, useState } from "react";
import type { GridState, Pixel } from "../types";
import { BASE_CELL_SIZE, BUFFER_PIXEL_RANGE } from "@/constants/webgl";
import { getPixelComponentFromEntities, getPixelEntities } from "@/libs/dojo/helper";
import { shouldFetch } from "@/utils/canvas";
import type { SDK } from "@dojoengine/sdk";
import type { PixelawSchemaType } from "@/libs/dojo/typescript/models.gen";
import { useDojoStore } from "@/store/dojo";
import { hexToRgba } from "@/utils";

const MAX_UINT32 = 4294967295;
const THROTTLE_MS = 80; // throttle interval

export const usePixels = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  gridState: GridState,
  sdk: SDK<PixelawSchemaType>,
) => {
  // Ref
  const lastFetchedRangeRef = useRef({ upperLeftX: 0, upperLeftY: 0, lowerRightX: 100, lowerRightY: 100 });
  const lastFetchTimeRef = useRef(0);

  // State
  const state = useDojoStore((state) => state);
  const [visiblePixels, setVisiblePixels] = useState<Pixel[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [optimisticPixels, setOptimisticPixels] = useOptimistic(visiblePixels, (pixels, newPixel: Pixel) => {
    return [...pixels, newPixel];
  });

  // Callbacks
  const getVisiblePixelRange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { upperLeftX: 0, upperLeftY: 0, lowerRightX: 0, lowerRightY: 0 };

    const visibleWidth = canvas.width / gridState.scale;
    const visibleHeight = canvas.height / gridState.scale;

    const upperLeftX = Math.floor(gridState.offsetX / BASE_CELL_SIZE);
    const upperLeftY = Math.floor(gridState.offsetY / BASE_CELL_SIZE);
    const lowerRightX = Math.ceil((gridState.offsetX + visibleWidth) / BASE_CELL_SIZE);
    const lowerRightY = Math.ceil((gridState.offsetY + visibleHeight) / BASE_CELL_SIZE);

    return { upperLeftX, upperLeftY, lowerRightX, lowerRightY };
  }, [gridState, canvasRef]);

  const fetchPixels = useCallback(async () => {
    if (isFetching) {
      console.log("isFetching");
      return;
    }
    const currentRange = getVisiblePixelRange();
    const lastRange = lastFetchedRangeRef.current;

    if (!shouldFetch(currentRange, lastRange)) {
      console.log("not enough distance");
      return;
    }
    const start = performance.now();
    console.log("fetch start");

    const { upperLeftX, upperLeftY, lowerRightX, lowerRightY } = currentRange;
    // Calculate scroll direction
    const scrollDirectionX = currentRange.upperLeftX - lastRange.upperLeftX;
    const scrollDirectionY = currentRange.upperLeftY - lastRange.upperLeftY;

    // Adjust BUFFER based on scroll direction
    const dynamicBufferX = scrollDirectionX > 0 ? BUFFER_PIXEL_RANGE * 1.5 : BUFFER_PIXEL_RANGE * 0.5;
    const dynamicBufferY = scrollDirectionY > 0 ? BUFFER_PIXEL_RANGE * 1.5 : BUFFER_PIXEL_RANGE * 0.5;

    setIsFetching(true);
    try {
      const entities = await getPixelEntities(sdk, state, {
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
          if (newPixel) {
            updatedPixels.set(`${newPixel.x},${newPixel.y}`, {
              x: newPixel?.x,
              y: newPixel?.y,
              color: newPixel?.color,
            } as Pixel);
          }
        });
        return Array.from(updatedPixels.values());
      });
      console.log("fetchPixels:", newPixels.length, "time:", performance.now() - start);
    } catch (error) {
      console.error("Error fetching pixels:", error);
    } finally {
      setIsFetching(false);
      lastFetchedRangeRef.current = currentRange;
    }
  }, [getVisiblePixelRange, sdk, isFetching, state]);

  const throttledFetchPixels = useCallback(() => {
    const now = performance.now();
    if (now - lastFetchTimeRef.current >= THROTTLE_MS) {
      lastFetchTimeRef.current = now;
      fetchPixels();
    }
  }, [fetchPixels]);

  // Effects
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      const subscription = await sdk.subscribeEntityQuery({
        query: {
          pixelaw: {
            Pixel: {
              $: {}, //NOTE: empty query to subscribe to all pixels
            },
          },
        },
        callback: (resp) => {
          if (resp.error) {
            console.error("Error setting up entity sync:", resp.error);
          } else if (resp.data && resp.data[0].entityId !== "0x0") {
            state.updateEntity(resp.data[0]);
            const pixel: Pixel = {
              x: resp.data[0].models.pixelaw.Pixel?.x ?? 0,
              y: resp.data[0].models.pixelaw.Pixel?.y ?? 0,
              color: hexToRgba(resp.data[0].models.pixelaw.Pixel?.color ?? 0),
            };
            setVisiblePixels((prev) => [...prev, pixel]);
          }
        },
      });

      unsubscribe = () => subscription.cancel();
    };

    subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sdk, setVisiblePixels, state]);

  // initial fetch
  useEffect(() => {
    fetchPixels();
  }, []);

  return { optimisticPixels, setOptimisticPixels, fetchPixels, throttledFetchPixels };
};
