import { Pixel } from "@/components/PixelViewer/types";
import { useEffect, useOptimistic, useState } from "react";
import { useDojo } from "./useDojo";
import { useGridState } from "./useGridState";

export const usePixels = () => {
  const {
    setup: { toriiClient },
  } = useDojo();

  const { gridState } = useGridState();

  const [pixels, setPixels] = useState<Pixel[]>([]);

  useEffect(() => {
    const fetchPixels = async () => {
      const pixelEntities = await toriiClient.getEntities({
        limit: 1000,
        offset: 0,
        clause: {
          Composite: {
            operator: "And",
            clauses: [
              { Member: { model: "pixelaw-Pixel", member: "x", operator: "Gt", value: { U32: gridState.offsetX } } },
              {
                Member: {
                  model: "pixelaw-Pixel",
                  member: "x",
                  operator: "Lt",
                  value: { U32: gridState.offsetX + gridState.scale },
                },
              },
              { Member: { model: "pixelaw-Pixel", member: "y", operator: "Gt", value: { U32: gridState.offsetY } } },
              {
                Member: {
                  model: "pixelaw-Pixel",
                  member: "y",
                  operator: "Lt",
                  value: { U32: gridState.offsetY + gridState.scale },
                },
              },
            ],
          },
        },
      });

      Object.values(pixelEntities).forEach((pixelEntity) => {
        console.log({pixelEntity});
      });
    };

    fetchPixels();
  }, [toriiClient, gridState]);

  const [optimisticPixels, setOptimisticPixels] = useOptimistic(pixels, (pixels, newPixel: Pixel) => {
    return [...pixels, newPixel];
  });

  return { pixels, optimisticPixels, setOptimisticPixels };
};
