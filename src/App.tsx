import { useQuerySync } from "@dojoengine/react";
import { PixelViewer } from "./components/PixelViewer";
import { useDojo } from "@/libs/dojo/useDojo";

function App() {
  const {
    setup: { contractComponents, toriiClient },
  } = useDojo();

  useQuerySync(toriiClient, contractComponents as any, []);

  return (
    <main className="h-screen w-screen">
      <PixelViewer />
    </main>
  );
}

export default App;
