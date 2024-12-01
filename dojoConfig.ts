import { createDojoConfig } from "@dojoengine/core";
import manifestDev from "./src/libs/dojo/manifests/manifest_dev.json" with { type: "json" };
import manifestSepolia from "./src/libs/dojo/manifests/manifest_sepolia.json" with { type: "json" };

export const manifest = import.meta.env.VITE_PUBLIC_PROFILE === "dev" ? manifestDev : manifestSepolia;

export const dojoConfig = createDojoConfig({
  toriiUrl: import.meta.env.VITE_PUBLIC_TORII_URL,
  rpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL,
  accountClassHash: import.meta.env.VITE_PUBLIC_ACCOUNT_CLASS_HASH,
  masterAddress: import.meta.env.VITE_PUBLIC_MASTER_ADDRESS,
  masterPrivateKey: import.meta.env.VITE_PUBLIC_MASTER_PRIVATE_KEY,
  manifest: import.meta.env.VITE_PUBLIC_PROFILE === "dev" ? manifestDev : manifestSepolia,
});
