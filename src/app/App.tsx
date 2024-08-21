import { useEntityQuery, useQuerySync } from "@dojoengine/react";
import { PixelViewer } from "../components/PixelViewer";
import { useDojo } from "@/libs/dojo/useDojo";
import { Header } from "../components/Header";
import { getComponentValue, Has } from "@dojoengine/recs";

function App() {
  const {
    setup: { contractComponents, toriiClient },
    account: { account },
  } = useDojo();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useQuerySync(toriiClient, contractComponents as any, []);

  const appEntities = useEntityQuery([Has(contractComponents.App)]);
  const apps = [...appEntities].map((entityId) => getComponentValue(contractComponents.App, entityId));
  console.log(apps);

  return (
    <main>
      <Header account={account} />
      <PixelViewer />
    </main>
  );
}

export default App;
