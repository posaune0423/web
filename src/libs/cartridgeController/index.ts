import { Connector } from "@starknet-react/core";
import CartridgeConnector from "@cartridge/connector";
import { getContractByName } from "@dojoengine/core";
import { ControllerOptions } from "@cartridge/controller";
import { manifest } from "../../../dojoConfig";
import { shortString } from "starknet";

const contract = getContractByName(manifest, "pixelaw", "paint_actions");
if (!contract?.address) {
  throw new Error("pixelaw paint_actions contract not found");
}
const paint_action_contract_address = contract?.address;

const policies = [
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
  // theme: "dope-wars",
  // colorMode: "light"
};

const cartridgeConnector = new CartridgeConnector(options) as never as Connector;

export default cartridgeConnector;
