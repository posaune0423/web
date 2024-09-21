import { createDojoConfig } from "@dojoengine/core";
import manifestDev from "./src/libs/dojo/manifests/dev/deployment/manifest.json";
import manifestSlot from "./src/libs/dojo/manifests/slot/deployment/manifest.json";

export const manifest = import.meta.env.VITE_PUBLIC_PROFILE === "dev" ? manifestDev : manifestSlot;

export const dojoConfig = createDojoConfig({
  toriiUrl: import.meta.env.VITE_PUBLIC_TORII_URL,
  rpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL,
  masterAddress: import.meta.env.VITE_PUBLIC_MASTER_ADDRESS,
  masterPrivateKey: import.meta.env.VITE_PUBLIC_MASTER_PRIVATE_KEY,
  manifest: import.meta.env.VITE_PUBLIC_PROFILE === "dev" ? manifestDev : manifestSlot,
});
