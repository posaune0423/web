import { Account } from "starknet";
import { DefaultParameters } from "@/libs/dojo/typescript/models.gen";
import { toast } from "sonner";
import { handleTransactionError } from "@/utils";
import { useDojoStore } from "@/store/dojo";
import { v4 as uuidv4 } from "uuid";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { dojoConfig } from "../../dojoConfig";
import { DojoProvider } from "@dojoengine/core";
import { client } from "@/libs/dojo/typescript/contracts.gen";
import { useAccount, useExplorer } from "@starknet-react/core";

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
  const { account } = useAccount();
  const explorer = useExplorer();

  const dojoProvider = new DojoProvider(dojoConfig.manifest, dojoConfig.rpcUrl);
  const dojoClient = client(dojoProvider);
  /**
   * Generates a unique entity ID based on the current account address.
   * @returns {string} The generated entity ID
   */
  const generateEntityId = () => {
    return getEntityIdFromKeys([BigInt(account?.address || "")]);
  };

  /**
   * Interacts with the the pixels by paint_actions.interact.
   * @returns {Promise<void>}
   * @throws {Error} If the interact action fails
   */
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
      const res = await dojoClient.paint_actions.interact(account, default_params);

      if (res?.transaction_hash) {
        toast.success(`View transaction on ${explorer?.name}`, {
          action: {
            label: "Tx",
            onClick: () => window.open(explorer?.transaction(res.transaction_hash), "_blank"),
          },
        });
      }

      // Wait for the entity to be updated with the new state
      await state.waitForEntityChange(entityId, (entity) => {
        return (
          entity?.models?.pixelaw?.Pixel?.x === default_params.position.x &&
          entity?.models?.pixelaw?.Pixel?.y === default_params.position.y
        );
      });
    } catch (e) {
      // Revert the optimistic update if an error occurs
      // TODO: FIX THIS. SHOULD NOT ignore timeout errors
      if (e instanceof Error && e.message.includes("Timeout of")) {
        return;
      }
      state.revertOptimisticUpdate(transactionId);
      handleError("paint interact", e);
    } finally {
      // Confirm the transaction if successful
      state.confirmTransaction(transactionId);
    }
  };

  return {
    interact,
  };
};
