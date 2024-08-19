import { useComponentValue, useQuerySync } from "@dojoengine/react";
import { PixelViewer } from "./components/PixelViewer";
import { useDojo } from "./dojo/useDojo";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { Entity } from "@dojoengine/recs";

function App() {
  const {
    setup: {
      clientComponents: { Pixel },
      contractComponents,
      toriiClient,
    },
  } = useDojo();

  useQuerySync(toriiClient, contractComponents as any, []);

  const entityId = getEntityIdFromKeys([1n, 1n]) as Entity;
  console.log({ entityId });

  // get current component values
  const pixel = useComponentValue(Pixel, entityId);
  console.log({ pixel });

  return (
    <main className="h-screen w-screen">
      <PixelViewer />
    </main>
  );
}

export default App;
