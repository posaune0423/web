import { App, GameState, Pixel } from "@/types";
import { felt252ToString, felt252ToUnicode, hexToRgba } from "@/utils";
import { SDK, StandardizedQueryResult } from "@dojoengine/sdk";
import { Entity } from "@dojoengine/torii-client";
import { PixelawSchemaType } from "./typescript/models.gen";

export const getPixelComponentValue = (entity: Entity): Pixel => {
  return {
    x: entity["pixelaw-Pixel"].x.value as number,
    y: entity["pixelaw-Pixel"].y.value as number,
    color: hexToRgba(entity["pixelaw-Pixel"].color.value as number),
  };
};

export const getAppComponentValue = (entity: Entity): App => {
  return {
    system: entity["pixelaw-App"].system.value as string,
    name: felt252ToString(entity["pixelaw-App"].name.value as string),
    icon: felt252ToUnicode(entity["pixelaw-App"].icon.value as string),
    action: entity["pixelaw-App"].action.value as string,
  };
};

export const getPixelComponentFromEntities = (entities: StandardizedQueryResult<PixelawSchemaType>): Pixel[] => {
  return (
    entities.map((entity) => {
      return {
        x: entity.models.pixelaw.Pixel?.x ?? 0,
        y: entity.models.pixelaw.Pixel?.y ?? 0,
        color: hexToRgba(entity.models.pixelaw.Pixel?.color ?? 0),
      };
    }) ?? []
  );
};

export const getPixelEntities = async (
  sdk: SDK<PixelawSchemaType>,
  state: GameState<PixelawSchemaType>,
  {
    upperLeftX,
    upperLeftY,
    lowerRightX,
    lowerRightY,
  }: { upperLeftX: number; upperLeftY: number; lowerRightX: number; lowerRightY: number },
) => {
  const entities = await sdk.getEntities(
    {
      pixelaw: {
        Pixel: {
          $: {
            where: {
              x: {
                $gte: upperLeftX,
                $lte: lowerRightX,
              },
              y: {
                $gte: upperLeftY,
                $lte: lowerRightY,
              },
            },
          },
        },
      },
    },
    (resp) => {
      if (resp.error) {
        console.error("resp.error.message:", resp.error.message);
        return;
      }
      if (resp.data) {
        state.setEntities(resp.data);
        console.log("resp.data:", resp.data);
      }
    },
  );

  return entities;
};
