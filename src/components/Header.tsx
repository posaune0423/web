import { Trash2 } from "lucide-react";
import { Account } from "starknet";
import Avatar from "./Avatar";
import { truncateAddress } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDojo } from "@/hooks/useDojo";
import { useMemo } from "react";
import Spinner from "./Spinner";
import { App } from "@/types";
import { toast } from "sonner";
import AppList from "./AppList";

const Header = ({ account, apps }: { account: Account; apps: App[] }) => {
  const {
    account: { select, list, create, remove, isDeploying },
  } = useDojo();

  const otherBurnerAccounts = useMemo(() => list().filter((a) => a.address !== account.address), [account, list]);

  const onSelect = (e: React.MouseEvent<HTMLDivElement>, address: string) => {
    e.preventDefault();
    select(address);
  };

  const onCreate = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    create();
  };

  const onDelete = (e: React.MouseEvent<SVGSVGElement>, address: string) => {
    e.preventDefault();
    remove(address);
  };

  const onCopy = (e: React.MouseEvent<HTMLDivElement>, address: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    toast.success("Copied!");
  };

  return (
    <header className="bg-slate-900 h-[50px] w-full flex items-center justify-between p-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-4">
        <h1 className="text-white text-lg font-bold">
          <img src="logo.png" alt="PixeLAW" className="object-contain h-10" />
        </h1>
        <AppList apps={apps} />
      </div>
      <div className="flex items-center space-x-4 border-2 border-slate-600 rounded-sm p-1 px-3">
        <div className="text-white cursor-pointer" onClick={(e) => onCopy(e, account.address)}>
          {truncateAddress(account.address)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar address={account.address} size={32} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Burner Accounts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {otherBurnerAccounts.map((account) => (
              <DropdownMenuItem
                onClick={(e) => onSelect(e, account.address)}
                key={account.address}
                className="cursor-pointer flex justify-between items-center"
              >
                {truncateAddress(account.address)}
                <Trash2 size={16} color="red" onClick={(e) => onDelete(e, account.address)} />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreate}>
              {isDeploying ? (
                <div className="flex items-center space-x-2 justify-between">
                  <Spinner color="black" />
                  Deploying...
                </div>
              ) : (
                <div className="flex items-center space-x-2">Create</div>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export { Header };
