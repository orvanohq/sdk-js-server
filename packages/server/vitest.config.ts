import { readFileSync } from "node:fs";
import { defineConfig, type ViteUserConfig } from "vitest/config";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

// Spec 0014 CNF-6: the servers api/conformance/compose.yaml starts. Override them to point somewhere else.
const servers = {
  stubUrl: process.env.ORVANO_STUB_URL ?? "http://localhost:18081",
  liveUrl: process.env.ORVANO_LIVE_URL ?? "http://localhost:18080",
  partial: process.env.ORVANO_CONFORMANCE_PARTIAL === "1",
};
const conformance = ["conformance/conformance.test.ts"];
const globalSetup = ["conformance/bootstrap.ts"];
const spawned = (runtime: "deno" | "bun") => ({
  extends: true,
  test: {
    name: `conformance-${runtime}`,
    include: ["conformance/spawned.test.ts"],
    testTimeout: 30_000,
    globalSetup,
    provide: { conformance: { ...servers, runtime } },
  },
});

// Spec 0005 SQA-1, SQA-3: unit tests in Node; the conformance suite in Node and in workerd (through Miniflare) on every
// PR, and in Deno and Bun nightly (each started by conformance/spawned.test.ts).
const config: ViteUserConfig = defineConfig({
  define: { __ORVANO_SDK_VERSION__: JSON.stringify(version) },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["test/**/*.test.ts"], environment: "node" },
      },
      {
        extends: true,
        test: {
          name: "conformance-node",
          include: conformance,
          globalSetup,
          provide: { conformance: { ...servers, runtime: "node" } },
        },
      },
      {
        extends: true,
        test: {
          name: "conformance-workerd",
          include: ["conformance/workerd.test.ts"],
          testTimeout: 30_000,
          globalSetup,
          provide: { conformance: { ...servers, runtime: "workerd" } },
        },
      },
      spawned("deno"),
      spawned("bun"),
    ],
  },
});

export default config;
