import Avatar from "./Avatar";
import { truncateAddress } from "@/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropDownMenu";
import { toast } from "sonner";
import { AppList } from "./AppList";
import { useControllerUsername } from "@/hooks/useControllerUserName";
import { useAccount, useDisconnect, useConnect, type Connector } from "@starknet-react/core";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useCallback } from "react";
import type ControllerConnector from "@cartridge/connector";

const Header = () => {
  const { disconnect } = useDisconnect();
  const { username } = useControllerUsername();
  const { account } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const ctrlConnector = connectors[0] as unknown as ControllerConnector;

  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const onCopy = (e: React.MouseEvent<HTMLDivElement>, address: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    toast.success("Copied!");
  };

  const handleConnect = useCallback(
    async (connector: Connector) => {
      try {
        setPending((prev) => ({ ...prev, [connector.id]: true }));
        await connectAsync({ connector });
        setIsOpen(false);
        toast.success("Successfully connected!");
      } catch (error) {
        console.error(error);
        toast.error("Wallet is not installed");
      } finally {
        setPending((prev) => ({ ...prev, [connector.id]: false }));
      }
    },
    [connectAsync],
  );

  return (
    <header className="bg-slate-900 h-[50px] w-full flex items-center justify-between p-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-4">
        <h1 className="text-white text-lg font-bold">
          <img src="logo.png" alt="PixeLAW" className="object-contain h-10" />
        </h1>
        <AppList />
      </div>
      <div className="flex items-center space-x-2 md:space-x-4 p-1 px-3">
        {account ? (
          <>
            <div
              className="text-white cursor-pointer text-xs md:text-base"
              onClick={(e) => onCopy(e, account.address || "")}
            >
              {username ? username : truncateAddress(account.address || "")}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar address={account.address || ""} size={32} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {username && (
                  <DropdownMenuItem>
                    <Button className="w-full" onClick={() => ctrlConnector.controller.openProfile()}>
                      PROFILE
                    </Button>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Button className="w-full" onClick={() => disconnect()}>
                    Disconnect
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Connect Wallet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Wallet</DialogTitle>
                <DialogDescription>Choose your preferred wallet to connect</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col space-y-3 py-2">
                {connectors.map((connector) => (
                  <Button
                    key={connector.id}
                    onClick={() => handleConnect(connector)}
                    className="flex w-full items-center gap-2"
                    disabled={pending[connector.id]}
                  >
                    {connector.icon?.dark &&
                      (connector.icon.dark.startsWith("<") ? (
                        <div
                          className="flex max-h-6 max-w-6 items-center justify-center"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                          dangerouslySetInnerHTML={{ __html: connector.icon.dark }}
                        />
                      ) : (
                        <img src={connector.icon.dark} alt={connector.name} width={24} height={24} />
                      ))}
                    {connector.name}
                    {pending[connector.id] && <span className="ml-2">Loading...</span>}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  );
};

export { Header };
