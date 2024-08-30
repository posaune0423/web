import { type DojoConfig, DojoProvider } from "@dojoengine/core";
import * as torii from "@dojoengine/torii-client";
import { BurnerManager } from "@dojoengine/create-burner";
import { Account, type ArraySignatureType } from "starknet";
import { createClientComponents } from "./createClientComponents";
import { createSystemCalls } from "./createSystemCalls";
import { defineContractComponents } from "./generated/components";
import { setupWorld } from "./generated/systems";
import { world } from "./world";
import { getSyncEntities } from "@dojoengine/state";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

export async function setup({ ...config }: DojoConfig) {
  // torii client
  const toriiClient = await torii.createClient({
    rpcUrl: config.rpcUrl,
    toriiUrl: config.toriiUrl,
    relayUrl: "",
    worldAddress: config.manifest.world.address || "",
  });

  // create contract components
  const contractComponents = defineContractComponents(world);

  // create client components
  const clientComponents = createClientComponents({ contractComponents });

  // fetch all existing entities from torii
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entities = getSyncEntities(toriiClient, clientComponents as any, []);
  console.log("entities", entities);

  // create dojo provider
  const dojoProvider = new DojoProvider(config.manifest, config.rpcUrl);

  // setup world
  const client = await setupWorld(dojoProvider);

  // create burner manager
  const burnerManager = new BurnerManager({
    masterAccount: new Account(
      {
        nodeUrl: config.rpcUrl,
      },
      config.masterAddress,
      config.masterPrivateKey
    ),
    accountClassHash: config.accountClassHash,
    rpcProvider: dojoProvider.provider,
    feeTokenAddress: config.feeTokenAddress,
  });

  try {
    await burnerManager.init();
    if (burnerManager.list().length === 0) {
      await burnerManager.create();
    }
  } catch (e) {
    console.error(e);
  }

  return {
    client,
    clientComponents,
    contractComponents,
    systemCalls: createSystemCalls({ client }, contractComponents, clientComponents),
    publish: (typedData: string, signature: ArraySignatureType) => {
      toriiClient.publishMessage(typedData, signature);
    },
    config,
    dojoProvider,
    burnerManager,
    toriiClient,
  };
}