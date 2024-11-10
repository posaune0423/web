import { Account } from "starknet";
import { DefaultParameters, Direction } from "@/libs/dojo/typescript/models.gen";
import { toast } from "sonner";
import { handleTransactionError } from "@/utils";
import { useDojo } from "./useDojo";
import { useDojoStore } from "@/app";
import { v4 as uuidv4 } from "uuid";
import { getEntityIdFromKeys } from "@dojoengine/utils";

const handleError = (action: string, error: unknown) => {
  console.error(`Error executing ${action}:`, error);
  const errorMessage = handleTransactionError(error);
  toast.error(errorMessage);
  throw error;
};

/**
 * Custom hook to handle system calls and state management in the Dojo application.
 * Provides functionality for spawning entities and managing optimistic updates.
 *
 * @returns An object containing system call functions:
 *   - spawn: Function to spawn a new entity with initial moves
 */
export const useSystemCalls = () => {
  const state = useDojoStore((state) => state);

  const {
    setup: { client },
    account: { account },
  } = useDojo();

  /**
   * Generates a unique entity ID based on the current account address.
   * @returns {string} The generated entity ID
   */
  const generateEntityId = () => {
    return getEntityIdFromKeys([BigInt(account?.address)]);
  };

  const interact = async (account: Account, default_params: DefaultParameters) => {
    // Generate a unique entity ID
    const entityId = generateEntityId();

    // Generate a unique transaction ID
    const transactionId = uuidv4();

    // Apply an optimistic update to the state
    // this uses immer drafts to update the state
    state.applyOptimisticUpdate(transactionId, (draft) => {
      if (draft.entities[entityId]?.models?.pixelaw?.Pixel) {
        draft.entities[entityId].models.pixelaw.Pixel = {
          x: default_params.position.x,
          y: default_params.position.y,
          color: default_params.color,
          owner: account?.address,
        };
      }
    });

    try {
      console.log("interact", default_params);
      await client.paint_actions.interact({
        account,
        default_params,
      });
      // Wait for the entity to be updated with the new state
      await state.waitForEntityChange(entityId, (entity) => {
        return (
          entity?.models?.pixelaw?.Pixel?.x === default_params.position.x &&
          entity?.models?.pixelaw?.Pixel?.y === default_params.position.y
        );
      });
    } catch (e) {
      // Revert the optimistic update if an error occurs
      state.revertOptimisticUpdate(transactionId);
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
    } catch (e) {
      handleError("snake interact", e);
    }
  };

  const pix2048Interact = async (account: Account, default_params: DefaultParameters) => {
    try {
      console.log("interact", default_params);
      await client.pix2048_actions.interact({
        account,
        default_params,
      });
    } catch (e) {
      handleError("pix2048 interact", e);
    }
  };

  return {
    interact,
    snakeInteract,
    pix2048Interact,
  };
};
