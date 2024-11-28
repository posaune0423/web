import { PixelViewer } from "../components/PixelViewer.tsx";
import { Header } from "../components/Header.tsx";
import { PixelawSchemaType } from "../libs/dojo/typescript/models.gen.ts";
import { SDK } from "@dojoengine/sdk";

export const App = ({ sdk }: { sdk: SDK<PixelawSchemaType> }) => {
  return (
    <main>
      <Header />
      <PixelViewer sdk={sdk} />
    </main>
  );
};
