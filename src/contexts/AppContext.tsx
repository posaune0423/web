import React, { createContext, useState, ReactNode, useMemo } from "react";
import { App } from "@/types";
import { useDojo } from "@/hooks/useDojo";
import { useEntityQuery } from "@dojoengine/react";
import { ComponentValue, getComponentValue, Has, Schema } from "@dojoengine/recs";
import { fromComponent } from "@/utils";

interface AppContextType {
  apps: App[];
  selectedApp: App;
  setSelectedApp: (app: App) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    setup: { contractComponents },
  } = useDojo();

  const appEntities = useEntityQuery([Has(contractComponents.App)]);
  const values = [...appEntities].map((entityId) =>
    getComponentValue(contractComponents.App, entityId),
  );
  const apps = useMemo(
    () =>
      values.reduce((acc: App[], appComponent: ComponentValue<Schema, unknown> | undefined) => {
        const app = fromComponent(appComponent);
        if (app) acc.push(app);
        return acc;
      }, []),
    [values],
  );

  const [selectedApp, setSelectedApp] = useState<App>(
    apps[0] ?? { name: "", system: "", icon: "" },
  );

  return (
    <AppContext.Provider value={{ apps, selectedApp, setSelectedApp }}>
      {children}
    </AppContext.Provider>
  );
};
