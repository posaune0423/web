import React, { createContext, useState, ReactNode } from "react";
import { App } from "@/types";

interface AppContextType {
  selectedApp: App | null;
  setSelectedApp: (app: App | null) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

  return <AppContext.Provider value={{ selectedApp, setSelectedApp }}>{children}</AppContext.Provider>;
};
