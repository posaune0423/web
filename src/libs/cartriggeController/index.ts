import { Connector } from "@starknet-react/core";
import CartridgeConnector from "@cartridge/connector";
import { getContractByName } from "@dojoengine/core";
import { ControllerOptions } from "@cartridge/controller";
import { manifest } from "../../../dojoConfig";
import { shortString } from "starknet";

const ETH_TOKEN_ADDRESS = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

const contract = getContractByName(manifest, "pixelaw", "paint_actions");
if (!contract?.address) {
  throw new Error("pixelaw paint_actions contract not found");
}

const paint_action_contract_address = contract?.address;

const policies = [
  {
    target: ETH_TOKEN_ADDRESS,
    method: "approve",
    description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  },
  {
    target: import.meta.env.VITE_PUBLIC_FEE_TOKEN_ADDRESS,
    method: "approve",
  },
  // paint_actions
  {
    target: paint_action_contract_address,
    method: "interact",
    description: "Interact with the paint_actions contract",
  },
];

const options: ControllerOptions = {
  rpc: import.meta.env.VITE_PUBLIC_RPC_URL,
  indexerUrl: import.meta.env.VITE_PUBLIC_TORII_URL,
  policies,
  paymaster: {
    caller: shortString.encodeShortString("ANY_CALLER"),
  },
};

const cartridgeConnector = new CartridgeConnector(options) as never as Connector;

export default cartridgeConnector;
