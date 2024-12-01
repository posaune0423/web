/// <reference types="vite/client" />

type ImportMetaEnv = {
  // Auto-generated by `npx vite-envs update-types` and hot-reloaded by the `vite-env` plugin
  // You probably want to add `/src/vite-env.d.ts` to your .prettierignore
  VITE_PUBLIC_TORII_URL: string;
  VITE_PUBLIC_RPC_URL: string;
  VITE_PUBLIC_ACCOUNT_CLASS_HASH: string;
  VITE_PUBLIC_MASTER_ADDRESS: string;
  VITE_PUBLIC_MASTER_PRIVATE_KEY: string;
  VITE_PUBLIC_FEE_TOKEN_ADDRESS: string;
  VITE_PUBLIC_PROFILE: string;
  VITE_PUBLIC_GA_ID: string;
  BASE_URL: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  // @user-defined-start
  /*
   *  You can use this section to explicitly extend the type definition of `import.meta.env`
   *  This is useful if you're using Vite plugins that define specific `import.meta.env` properties.
   *  If you're not using such plugins, this section should remain as is.
   */
  SSR: boolean;
  // @user-defined-end
};

interface ImportMeta {
  // Auto-generated by `npx vite-envs update-types`

  url: string;

  readonly hot?: import("vite/types/hot").ViteHotContext;

  readonly env: ImportMetaEnv;

  glob: import("vite/types/importGlob").ImportGlobFunction;
}
