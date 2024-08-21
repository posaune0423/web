import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app/App.tsx";
import { setup } from "@/libs/dojo/generated/setup.ts";
import { DojoProvider } from "@/libs/dojo/DojoContext.tsx";
import { dojoConfig } from "../dojoConfig.ts";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

async function init() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("React root not found");
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  const setupResult = await setup(dojoConfig);

  if (!setupResult) {
    root.render(
      <div className="bg-black/90 flex h-screen items-center justify-center text-xl text-white">Loading...</div>
    );
    return;
  }

  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <DojoProvider value={setupResult}>
          <App />
          <Toaster richColors position="bottom-right" closeButton />
        </DojoProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

init();
