import type { ParsedEntity, SchemaType } from "@dojoengine/sdk";
import type { Draft } from "immer";
import type { Patch } from "immer";

export type App = {
  system: string;
  name: string;
  icon: string;
  action: string;
};

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface GridState {
  offsetX: number;
  offsetY: number;
  scale: number;
  lastPinchDist?: number;
}

export interface Pixel {
  x: number;
  y: number;
  color: Color;
}

export interface PixelRange {
  upperLeftX: number;
  upperLeftY: number;
  lowerRightX: number;
  lowerRightY: number;
}

export interface GridAction {
  type: "add" | "remove";
  pixel: Pixel;
}

export interface GridHistory {
  past: Pixel[][];
  present: Pixel[];
  future: Pixel[][];
}

// ============= not exported interfaces in dojo sdk =============

interface PendingTransaction {
  transactionId: string;
  patches: Patch[];
  inversePatches: Patch[];
}

export interface GameState<T extends SchemaType> {
  entities: Record<string, ParsedEntity<T>>;
  pendingTransactions: Record<string, PendingTransaction>;
  setEntities: (entities: ParsedEntity<T>[]) => void;
  updateEntity: (entity: Partial<ParsedEntity<T>>) => void;
  applyOptimisticUpdate: (transactionId: string, updateFn: (draft: Draft<GameState<T>>) => void) => void;
  revertOptimisticUpdate: (transactionId: string) => void;
  confirmTransaction: (transactionId: string) => void;
  subscribeToEntity: (entityId: string, listener: (entity: ParsedEntity<T> | undefined) => void) => () => void;
  waitForEntityChange: (
    entityId: string,
    predicate: (entity: ParsedEntity<T> | undefined) => boolean,
    timeout?: number,
  ) => Promise<ParsedEntity<T> | undefined>;
  getEntity: (entityId: string) => ParsedEntity<T> | undefined;
  getEntities: (filter?: (entity: ParsedEntity<T>) => boolean) => ParsedEntity<T>[];
  getEntitiesByModel: (namespace: keyof T, model: keyof T[keyof T]) => ParsedEntity<T>[];
}
