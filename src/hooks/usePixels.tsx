import { Pixel } from "@/types";
import { hexToRgba } from "@/utils";
import { useEntityQuery, useQuerySync } from "@dojoengine/react";
import { getComponentValue, Has } from "@dojoengine/recs";
import { useMemo, useOptimistic } from "react";
import { useDojo } from "./useDojo";

export const usePixels = () => {
  const {
    setup: {
      contractComponents,
      clientComponents: { Pixel },
      toriiClient,
    },
  } = useDojo();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useQuerySync(toriiClient, contractComponents as any, []);

  const pixelEntities = useEntityQuery([Has(Pixel)]);
  const pixels = useMemo(
    () =>
      pixelEntities
        .map((entity) => {
          const value = getComponentValue(Pixel, entity);
          if (!value) return;
          return {
            x: value.x,
            y: value.y,
            color: hexToRgba(value.color),
          };
        })
        .filter((pixel): pixel is Pixel => pixel !== undefined),
    [pixelEntities]
  );

  const [optimisticPixels, setOptimisticPixels] = useOptimistic(pixels, (pixels, newPixel: Pixel) => {
    return [...pixels, newPixel];
  });

  return { optimisticPixels, setOptimisticPixels };
};
