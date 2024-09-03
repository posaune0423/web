# PixeLAW Client

![PixeLAW](https://pixelaw.github.io/book/images/PixeLAW.jpeg)

[![CI](https://github.com/posaune0423/web/actions/workflows/ci.yml/badge.svg)](https://github.com/posaune0423/web/actions/workflows/ci.yml)

This project is the client application for PixeLAW, a decentralized pixel-based game platform built on the Dojo engine.

## Tech Stack

- React 19
- TypeScript
- Vite
- [Dojo JS v1.0.0-alpha.12](https://github.com/dojoengine/dojo.js)
- [Starknet](https://www.starknet.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [twgl.js](https://twgljs.org/)
- [shadcn/ui](https://ui.shadcn.com/)

## How to Run

1. Clone the repository
2. Install dependencies:
   ```
   bun i
   ```
3. Start the development server:
   ```
   bun run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

## Directory Structure

```
├── src
│   ├── app
│   ├── components
│   ├── constants
│   ├── contexts
│   ├── hooks
│   ├── index.scss
│   ├── libs
│   ├── main.tsx
│   ├── types
│   ├── utils
│   └── vite-env.d.ts
```

## Slot
Currently Version `1.0.0-alpha.9` is live!

- Katana: https://api.cartridge.gg/x/pixelaw-dev/katana
- Torii: https://api.cartridge.gg/x/pixelaw-dev/torii


## Contributing

Contributions are welcome! Please follow the existing code style and create a new PR.

## License

[LICENSE](https://github.com/pixelaw/core/blob/main/LICENSE)

For more information on the underlying smart contracts, please refer to the [pixelaw/core repository](https://github.com/pixelaw/core).
