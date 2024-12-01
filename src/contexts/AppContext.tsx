// @deno-types="@types/react"
import React, { createContext, ReactNode, useEffect, useMemo, useState } from "react";
import { SDK } from "@dojoengine/sdk";
import { PixelawSchemaType } from "../libs/dojo/typescript/models.gen.ts";
import { useDojoStore } from "../store/dojo.ts";
import { App } from "../types/index.ts";
import { getAppComponentValue } from "../libs/dojo/helper.ts";

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
