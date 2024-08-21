import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setup } from "@/libs/dojo/generated/setup.ts";
import { DojoProvider } from "@/libs/dojo/DojoContext.tsx";
import { dojoConfig } from "../dojoConfig.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ThemeProvider.tsx";

async function init() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("React root not found");
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  const setupResult = await setup(dojoConfig);

  !setupResult && (
    <div className="bg-black/90 flex h-screen items-center justify-center text-xl text-white">Loading...</div>
  );

  const queryClient = new QueryClient();

  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <DojoProvider value={setupResult}>
            <App />
          </DojoProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

init();
