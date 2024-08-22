import { useQuerySync } from "@dojoengine/react";
import { PixelViewer } from "../components/PixelViewer";
import { useDojo } from "@/hooks/useDojo";
import { Header } from "../components/Header";
import { type App } from "@/types";

const App = () => {
  const {
    setup: { contractComponents, toriiClient },
    account: { account },
  } = useDojo();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useQuerySync(toriiClient, contractComponents as any, []);

  return (
    <main>
      <Header account={account} />
      <PixelViewer />
    </main>
  );
};

export default App;
