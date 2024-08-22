import { useEntityQuery, useQuerySync } from "@dojoengine/react";
import { PixelViewer } from "../components/PixelViewer";
import { useDojo } from "@/hooks/useDojo";
import { Header } from "../components/Header";
import { ComponentValue, getComponentValue, Has, Schema } from "@dojoengine/recs";
import { fromComponent } from "@/utils";
import { useMemo } from "react";
import { type App } from "@/types";

const App = () => {
  const {
    setup: { contractComponents, toriiClient },
    account: { account },
  } = useDojo();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useQuerySync(toriiClient, contractComponents as any, []);

  const appEntities = useEntityQuery([Has(contractComponents.App)]);
  const values = [...appEntities].map((entityId) => getComponentValue(contractComponents.App, entityId));
  const apps = useMemo(
    () =>
      values.reduce((acc: App[], appComponent: ComponentValue<Schema, unknown> | undefined) => {
        const app = fromComponent(appComponent);
        if (app) acc.push(app);
        return acc;
      }, []),
    [values]
  );

  return (
    <main>
      <Header account={account} apps={apps} />
      <PixelViewer />
    </main>
  );
};

export default App;
