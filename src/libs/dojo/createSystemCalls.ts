import { defineSystem, Has, World } from "@dojoengine/recs";
import { ClientComponents } from "./createClientComponents";
import type { IWorld } from "./typescript/contracts.gen";
import { Account } from "starknet";
import { DefaultParameters, Direction } from "./typescript/models.gen";
import { toast } from "sonner";
import { handleTransactionError } from "@/utils";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

const handleError = (action: string, error: unknown) => {
  console.error(`Error executing ${action}:`, error);
  const errorMessage = handleTransactionError(error);
  toast.error(errorMessage);
  throw error;
};

export function createSystemCalls({ client }: { client: IWorld }, clientComponents: ClientComponents, world: World) {
  const interact = async (account: Account, default_params: DefaultParameters) => {
    try {
      console.log("interact", default_params);
      await client.paint_actions.interact({
        account,
        default_params,
      });

      // Wait for the indexer to update the entity
      // By doing this we keep the optimistic UI in sync with the actual state
      await new Promise<void>((resolve) => {
        defineSystem(world, [Has(clientComponents.Pixel)], () => {
          resolve();
        });
      });
    } catch (e) {
      handleError("paint interact", e);
    }
  };
  const snakeInteract = async (account: Account, default_params: DefaultParameters, direction: Direction) => {
    try {
      console.log("interact", default_params);
      await client.snake_actions.interact({
        account,
        default_params,
        direction,
      });

      // Wait for the indexer to update the entity
      // By doing this we keep the optimistic UI in sync with the actual state
      await new Promise<void>((resolve) => {
        defineSystem(world, [Has(clientComponents.Snake)], () => {
          resolve();
        });
      });
    } catch (e) {
      handleError("snake interact", e);
    }
  };

  return {
    interact,
    snakeInteract,
  };
}
