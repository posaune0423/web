import Avatar from "./Avatar";
import { truncateAddress } from "@/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropDownMenu";
import { toast } from "sonner";
import { AppList } from "./AppList";
import { ConnectButton } from "./ConnectButton";
import { useControllerUsername } from "@/hooks/useControllerUserName";
import { useAccount, useDisconnect } from "@starknet-react/core";
import { Button } from "./ui/Button";

const Header = () => {
  const onCopy = (e: React.MouseEvent<HTMLDivElement>, address: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    toast.success("Copied!");
  };
  const { disconnect } = useDisconnect();
  const { username } = useControllerUsername();

  const { account } = useAccount();

  return (
    <header className="bg-slate-900 h-[50px] w-full flex items-center justify-between p-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-4">
        <h1 className="text-white text-lg font-bold">
          <img src="logo.png" alt="PixeLAW" className="object-contain h-10" />
        </h1>
        <AppList />
      </div>
      <div className="flex items-center space-x-2 md:space-x-4 border-2 border-slate-600 rounded-sm p-1 px-3">
        <div
          className="text-white cursor-pointer text-xs md:text-base"
          onClick={(e) => onCopy(e, account?.address || "")}
        >
          {username ? username : truncateAddress(account?.address || "")}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar address={account?.address || ""} size={32} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              {account ? <Button onClick={() => disconnect()}>Disconnect</Button> : <ConnectButton />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export { Header };
