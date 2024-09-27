import React, { createContext, useState, ReactNode, useMemo, useEffect } from "react";
import { App } from "@/types";
import { useDojo } from "@/hooks/useDojo";
import { getAppComponentValue } from "@/libs/dojo/helper";
import { Entities } from "@dojoengine/torii-client";

interface AppContextType {
  apps: App[];
  selectedAppIndex: number;
  setSelectedAppIndex: (index: number) => void;
  currentApp: App;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    setup: { toriiClient },
  } = useDojo();

  const [appEntities, setAppEntities] = useState<Entities>({});
  const apps = useMemo(() => Object.values(appEntities).map((entity) => getAppComponentValue(entity)), [appEntities]);
  const [selectedAppIndex, setSelectedAppIndex] = useState<number>(0);
  const currentApp = useMemo(() => apps[selectedAppIndex], [apps, selectedAppIndex]);

  useEffect(() => {
    const fetchApps = async () => {
      const appEntities = await toriiClient.getEntities({
        limit: 100,
        offset: 0,
        clause: {
          Keys: {
            keys: [],
            pattern_matching: "VariableLen",
            models: ["pixelaw-App"],
          },
        },
      });
      setAppEntities(appEntities);
    };

    fetchApps();
  }, [toriiClient]);

  return <AppContext.Provider value={{ apps, selectedAppIndex, setSelectedAppIndex, currentApp }}>{children}</AppContext.Provider>;
};
