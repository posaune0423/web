import React, { createContext, useState, ReactNode, useMemo, useEffect } from "react";
import { App } from "@/types";
import { getAppComponentValue } from "@/libs/dojo/helper";
import { Entities } from "@dojoengine/torii-client";
import { SDK } from "@dojoengine/sdk";
import { PixelawSchemaType } from "@/libs/dojo/typescript/models.gen";

interface AppContextType {
  apps: App[];
  selectedAppIndex: number;
  setSelectedAppIndex: (index: number) => void;
  currentApp: App;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; sdk: SDK<PixelawSchemaType> }> = ({ children, sdk }) => {
  const [appEntities, setAppEntities] = useState<Entities>({});
  const apps = useMemo(() => Object.values(appEntities).map((entity) => getAppComponentValue(entity)), [appEntities]);
  const [selectedAppIndex, setSelectedAppIndex] = useState<number>(0);
  const currentApp = useMemo(() => apps[selectedAppIndex], [apps, selectedAppIndex]);

  useEffect(() => {
    const fetchApps = async () => {
      await sdk.getEntities(
        {
          pixelaw: { App: {} },
        },
        (resp) => {
          if (resp.error) {
            console.error("resp.error.message:", resp.error.message);
            return;
          }
          if (resp.data) {
            console.log("resp.data:", resp.data);
          }
        },
      );
    };

    fetchApps();
  }, [sdk]);

  return (
    <AppContext.Provider value={{ apps, selectedAppIndex, setSelectedAppIndex, currentApp }}>
      {children}
    </AppContext.Provider>
  );
};
