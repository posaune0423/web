import { createDojoConfig } from "@dojoengine/core";
// import manifest from "../core/contracts/manifests/dev/deployment/manifest.json";
import manifest from "./src/libs/dojo/generated/manifests/deployments/slot/manifest.json";

export const dojoConfig = createDojoConfig({
  toriiUrl: import.meta.env.VITE_PUBLIC_TORII_URL,
  rpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL,
  masterAddress: import.meta.env.VITE_PUBLIC_MASTER_ADDRESS,
  masterPrivateKey: import.meta.env.VITE_PUBLIC_MASTER_PRIVATE_KEY,
  manifest: manifest,
});
