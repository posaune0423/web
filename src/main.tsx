import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import App from "./app/App";
import { setup } from "@/libs/dojo/setup";
import { DojoProvider } from "@/contexts/DojoContext";
import { dojoConfig } from "../dojoConfig";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/Sonner";
import SwipeControl from "./components/SwipeControl";
import { AppProvider } from "./contexts/AppContext";

const init = async () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("React root not found");
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  const setupResult = await setup(dojoConfig);

  if (!setupResult) {
    root.render(
      <div className="bg-[#010101cc] flex h-screen items-center justify-center text-xl text-white">Loading...</div>
    );
    return;
  }

  root.render(
    <React.StrictMode>
      <SwipeControl>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <DojoProvider value={setupResult}>
            <AppProvider>
              <App />
            </AppProvider>
            <Toaster richColors position="bottom-right" closeButton />
          </DojoProvider>
        </ThemeProvider>
      </SwipeControl>
    </React.StrictMode>
  );
};

init();
