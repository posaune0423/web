import type { PixelawSchemaType } from "@/libs/dojo/typescript/models.gen";
import { createDojoStore } from "@dojoengine/sdk";

/**
 * Global store for managing Dojo game state.
 */
export const useDojoStore = createDojoStore<PixelawSchemaType>();
