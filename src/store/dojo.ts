import { PixelawSchemaType } from "../libs/dojo/typescript/models.gen.ts";
import { createDojoStore } from "@dojoengine/sdk";

/**
 * Global store for managing Dojo game state.
 */
export const useDojoStore = createDojoStore<PixelawSchemaType>();
