import { Pixel } from "@/components/PixelViewer/types";
import { ContractComponents } from "@/libs/dojo/generated/contractComponents";
import { hexToRgba } from "@/utils";
import { useEntityQuery } from "@dojoengine/react";
import { getComponentValue, Has } from "@dojoengine/recs";
import { useMemo } from "react";

export const usePixels = (PixelComponent: ContractComponents["Pixel"]) => {
  const pixelEntities = useEntityQuery([Has(PixelComponent)]);
  const pixels = useMemo(
    () =>
      pixelEntities
        .map((entity) => {
          const value = getComponentValue(PixelComponent, entity);
          if (!value) return;
          return {
            x: value.x,
            y: value.y,
            color: hexToRgba(value.color),
          };
        })
        .filter((pixel): pixel is Pixel => pixel !== undefined),
    [pixelEntities, PixelComponent],
  );

  return { pixels };
};
