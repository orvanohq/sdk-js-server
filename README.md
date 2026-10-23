# Orvano JavaScript Server SDK

An Orvano SDK for JavaScript and TypeScript. Orvano is an open source, self hostable backend as a service; see
[orvanohq/orvano](https://github.com/orvanohq/orvano).

## Install

```bash
pnpm add @orvano/server
```

## Use

```ts
import { createClient, Health } from "@orvano/server";

const client = createClient({
  url: "https://orvano.example.com",
  project: "<project id>",
  key: "<secret key>",
});
const health = await new Health(client).get(); // { status: "ok", apiVersions: [...] }
```

It runs on Node, Cloudflare Workers, Deno, and Bun. The key is a secret: a browser or React Native bundle that imports this package throws on load, pointing to `@orvano/client` (spec 0005 KEY-1).

## Develop

You need Node 24 (`.node-version`), pnpm, and Docker (or Podman) for the conformance suite.

- `pnpm check`, `pnpm build`, `pnpm test`, and `pnpm size` are the checks CI runs.
- `pnpm regenerate` rewrites `packages/server/src/generated/`, `src/runtime/`, and the two `conformance/*.generated.*` files from the orvano commit pinned in `orvano-contract.json` (spec 0014 RGN-1, RGN-2). It fetches that commit into `.orvano/`. Never edit those files by hand: CI regenerates them and fails on any difference. `pnpm regenerate --pin <sha>` moves the pin.
- `pnpm conformance` runs every server scenario in Node and inside workerd through Miniflare (spec 0014 CNF-5). Start the servers first, from the pinned checkout:

  ```bash
  docker build --file .orvano/deploy/Dockerfile --tag orvano:pinned .orvano
  ORVANO_IMAGE=orvano ORVANO_IMAGE_TAG=pinned docker compose --file .orvano/api/conformance/compose.yaml up --detach --wait
  pnpm conformance
  ```

  A scenario that can't run here goes in `packages/server/conformance/skip.json` with a reason and an issue link; any other scenario that doesn't run fails the suite. Set `ORVANO_CONFORMANCE_PARTIAL=1` when you run a few with `-t`.

## License

Apache License 2.0 (see `LICENSE` and `NOTICE`). The name "Orvano" and its logo aren't covered by the license;
see [TRADEMARKS.md](https://github.com/orvanohq/orvano/blob/main/TRADEMARKS.md).
