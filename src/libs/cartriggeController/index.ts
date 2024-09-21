import { Connector } from "@starknet-react/core";
import CartridgeConnector from "@cartridge/connector";
import { getContractByName } from "@dojoengine/core";
import { ControllerOptions } from "@cartridge/controller";

import { manifest } from "../../../dojoConfig";

const paint_action_contract_address = getContractByName(manifest, "pixelaw", "paint_actions")?.address;

const policies = [
  {
    target: import.meta.env.VITE_PUBLIC_FEE_TOKEN_ADDRESS,
    method: "approve",
  },
  // paint_actions
  {
    target: paint_action_contract_address,
    method: "interact",
  },
];

const options: ControllerOptions = {
  rpc: import.meta.env.VITE_PUBLIC_RPC_URL,
  policies,
  paymaster: {
    caller: "0x1091e8bd03d373366cc8fd0adaeac683293a67eeb1e5a9e2c68677ce2c77cb2",
  },
};

const cartridgeConnector = new CartridgeConnector(options) as never as Connector;

export default cartridgeConnector;
