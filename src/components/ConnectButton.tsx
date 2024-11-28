import { type Connector, useConnect } from "@starknet-react/core";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/Button.tsx";

export const ConnectButton = () => {
  const { connectAsync, connectors } = useConnect();

  const handleConnect = useCallback(
    async (connector: Connector) => {
      try {
        await connectAsync({ connector });
        toast.success("Successfully logged in");
      } catch (error) {
        console.error(error);
        toast.error("Wallet is not installed");
      }
    },
    [connectAsync],
  );

  return <Button onClick={() => handleConnect(connectors[0])}>Connect Controller</Button>;
};
