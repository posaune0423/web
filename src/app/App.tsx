import { PixelViewer } from "../components/PixelViewer";
import { useDojo } from "@/hooks/useDojo";
import { Header } from "../components/Header";
import { type App } from "@/types";

const App = () => {
  const {
    account: { account },
  } = useDojo();

  return (
    <main>
      <Header account={account} />
      <PixelViewer />
    </main>
  );
};

export default App;
