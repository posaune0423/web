import { PixelViewer } from "@/components/PixelViewer";
import { Header } from "@/components/Header";
import type { PixelawSchemaType } from "@/libs/dojo/typescript/models.gen";
import type { SDK } from "@dojoengine/sdk";

export const App = ({ sdk }: { sdk: SDK<PixelawSchemaType> }) => {
  return (
    <main>
      <Header />
      <PixelViewer sdk={sdk} />
    </main>
  );
};
