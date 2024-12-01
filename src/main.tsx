import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import { App } from "./app";
import { init } from "@dojoengine/sdk";
import { type PixelawSchemaType, schema } from "@/libs/dojo/typescript/models.gen";
// import { DojoContextProvider } from "@/contexts/DojoContext";
// import { setupBurnerManager } from "@dojoengine/create-burner";
import { dojoConfig } from "../dojoConfig";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/Sonner";
import SwipeControl from "./components/SwipeControl";
import { Connector, StarknetConfig, argent, voyager } from "@starknet-react/core";
import cartridgeConnector from "@/libs/cartridgeController";
import { sepolia } from "@starknet-react/chains";
import { RpcProvider } from "starknet";
import { ArgentMobileConnector } from "starknetkit/argentMobile";
import ReactGA from "react-ga4";
import { AppProvider } from "./contexts/AppContext";
import { detectMobile } from "./utils/devices";

ReactGA.initialize(import.meta.env.VITE_PUBLIC_GA_ID);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("React root not found");
const root = ReactDOM.createRoot(rootElement as HTMLElement);

const chainId = import.meta.env.VITE_PUBLIC_PROFILE === "dev" ? "KATANA" : "SEPOLIA";
const argentMobileConnector = ArgentMobileConnector.init({
  options: { dappName: "Pixelaw", url: "https://pixelaw.xyz" },
}) as unknown as Connector;
const connectors: Connector[] = detectMobile() ? [cartridgeConnector, argentMobileConnector] : [argent()];

const main = async () => {
  const sdk = await init<PixelawSchemaType>(
    {
      client: {
        rpcUrl: dojoConfig.rpcUrl,
        toriiUrl: dojoConfig.toriiUrl,
        relayUrl: dojoConfig.relayUrl,
        worldAddress: dojoConfig.manifest.world.address,
      },
      domain: {
        name: "pixelaw",
        version: "1.0",
        chainId,
        revision: "1",
      },
    },
    schema,
  );

  return (
    <React.StrictMode>
      <SwipeControl>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <StarknetConfig
            chains={[sepolia]}
            provider={() => new RpcProvider({ nodeUrl: import.meta.env.VITE_PUBLIC_RPC_URL })}
            connectors={connectors}
            explorer={voyager}
            autoConnect
          >
            {/* <DojoContextProvider burnerManager={await setupBurnerManager(dojoConfig)}> */}
              <AppProvider sdk={sdk}>
                <App sdk={sdk} />
              </AppProvider>
              <Toaster richColors position="bottom-right" closeButton />
            {/* </DojoContextProvider> */}
          </StarknetConfig>
        </ThemeProvider>
      </SwipeControl>
    </React.StrictMode>
  );
};

root.render(await main());
