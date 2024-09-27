import { App, Pixel } from "@/types";
import { felt252ToString, felt252ToUnicode, hexToRgba } from "@/utils";

import { Entities, Entity, ToriiClient } from "@dojoengine/torii-client";

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

export const getPixelComponentFromEntities = (entities: Entities) => {
  return Object.values(entities).map(getPixelComponentValue);
};

export const getPixelEntities = async (
  client: ToriiClient,
  limit: number,
  {
    upperLeftX,
    upperLeftY,
    lowerRightX,
    lowerRightY,
  }: { upperLeftX: number; upperLeftY: number; lowerRightX: number; lowerRightY: number }
) => {
  const entities = await client.getEntities({
    limit,
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
              value: { Primitive: { U32: upperLeftX } },
            },
          },
          {
            Member: {
              model: "pixelaw-Pixel",
              member: "y",
              operator: "Gte",
              value: { Primitive: { U32: upperLeftY } },
            },
          },
          {
            Member: {
              model: "pixelaw-Pixel",
              member: "x",
              operator: "Lte",
              value: { Primitive: { U32: lowerRightX } },
            },
          },
          {
            Member: {
              model: "pixelaw-Pixel",
              member: "y",
              operator: "Lte",
              value: { Primitive: { U32: lowerRightY } },
            },
          },
        ],
      },
    },
  });

  return entities;
};
