import { PixelViewer } from "@/components/PixelViewer";
import { Header } from "@/components/Header";
import { PixelawSchemaType } from "@/libs/dojo/typescript/models.gen";
import { SDK, createDojoStore } from "@dojoengine/sdk";

/**
 * Global store for managing Dojo game state.
 */
export const useDojoStore = createDojoStore<PixelawSchemaType>();

export const App = ({ sdk }: { sdk: SDK<PixelawSchemaType> }) => {
  return (
    <main>
      <Header />
      <PixelViewer sdk={sdk} />
    </main>
  );
};
