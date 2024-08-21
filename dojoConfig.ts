import { createDojoConfig } from "@dojoengine/core"
import manifest from "../core/contracts/manifests/dev/deployment/manifest.json"

export const dojoConfig = createDojoConfig({
  manifest,
})
