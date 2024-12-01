import type React from "react";
import { createContext, useState, type ReactNode, useMemo, useEffect } from "react"
import type { SDK } from "@dojoengine/sdk";
import type { PixelawSchemaType } from "@/libs/dojo/typescript/models.gen";
import { useDojoStore } from "@/store/dojo";
import type { App } from "@/types";
import { getAppComponentValue } from "@/libs/dojo/helper";

interface AppContextType {
  apps: App[];
  selectedAppIndex: number;
  setSelectedAppIndex: (index: number) => void;
  currentApp: App;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; sdk: SDK<PixelawSchemaType> }> = ({ children, sdk }) => {
  const state = useDojoStore((state) => state);
  const entities = state.getEntitiesByModel("pixelaw", "App");
  const apps = entities.map((entity) => getAppComponentValue(entity));

  const [selectedAppIndex, setSelectedAppIndex] = useState<number>(0);
  const currentApp = useMemo(() => apps[selectedAppIndex], [apps, selectedAppIndex]);

  useEffect(() => {
    const fetchApps = async () => {
      await sdk.getEntities({
        query: {
          pixelaw: {
            App: {
              $: {
                where: {
                  name: { $gte: 0 },
                },
              },
            },
          },
        },
        callback: (resp) => {
          if (resp.error) {
            console.error("resp.error.message:", resp.error.message);
            return;
          }
          if (resp.data) {
            state.setEntities(resp.data);
          }
        },
      });
    };

    fetchApps();
  }, [sdk]);

  return (
    <AppContext.Provider value={{ apps, selectedAppIndex, setSelectedAppIndex, currentApp }}>
      {children}
    </AppContext.Provider>
  );
};
