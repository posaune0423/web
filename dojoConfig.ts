import { createDojoConfig } from "@dojoengine/core";
import manifestDev from "./src/libs/dojo/generated/manifests/deployments/dev/manifest.json";
import manifestRelease from "./src/libs/dojo/generated/manifests/deployments/slot/manifest.json";

export const dojoConfig = createDojoConfig({
  toriiUrl: import.meta.env.VITE_PUBLIC_TORII_URL,
  rpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL,
  masterAddress: import.meta.env.VITE_PUBLIC_MASTER_ADDRESS,
  masterPrivateKey: import.meta.env.VITE_PUBLIC_MASTER_PRIVATE_KEY,
  manifest: import.meta.env.VITE_PUBLIC_PROFILE === "dev" ? manifestDev : manifestRelease,
});
