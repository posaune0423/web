/* eslint-disable @typescript-eslint/no-unused-vars -- for now */
import { type AccountInterface } from "starknet";
import { type ClientComponents } from "./createClientComponents";
import { type ContractComponents } from "./generated/contractComponents";
import type { DefaultParams, IWorld, PixelUpdate } from "./generated/generated";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { client }: { client: IWorld },
  contractComponents: ContractComponents,
  clientComponents: ClientComponents
) {
  const initCore = async (account: AccountInterface) => {
    try {
      await client.actions.initCore({
        account,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updatePixel = async (account: AccountInterface, pixelUpdate: PixelUpdate) => {
    try {
      await client.actions.updatePixel(account, pixelUpdate);
    } catch (e) {
      console.error(e);
    }
  };

  const initPaint = async (account: AccountInterface) => {
    try {
      await client.actions.initPaint(account);
    } catch (e) {
      console.error(e);
    }
  };

  const interact = async (account: AccountInterface, params: Pick<DefaultParams, "x" | "y" | "color">) => {
    try {
      await client.actions.interact(account, { ...params });
    } catch (e) {
      console.error(e);
    }
  };

  return {
    initCore,
    updatePixel,
    initPaint,
    interact,
  };
}
